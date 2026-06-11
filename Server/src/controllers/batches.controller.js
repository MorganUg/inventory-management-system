import pool from "../config/db.js";
import { completeBatch } from "../services/batchService.js";

async function getBatchDetail(batchId) {
  const batch = await pool.query(
    "SELECT * FROM production_batches WHERE id = $1",
    [batchId],
  );
  if (!batch.rows[0]) return null;

  const materials = await pool.query(
    `SELECT bm.*, rm.name AS material_name, rm.unit
       FROM batch_materials bm
       JOIN raw_materials rm ON rm.id = bm.material_id
       WHERE bm.batch_id = $1`,
    [batchId],
  );

  const outputs = await pool.query(
    `SELECT bo.*, fg.name AS finished_good_name
       FROM batch_outputs bo
       JOIN finished_goods fg ON fg.id = bo.finished_good_id
       WHERE bo.batch_id = $1`,
    [batchId],
  );

  return {
    ...batch.rows[0],
    materials: materials.rows,
    outputs: outputs.rows,
  };
}

export const getAll = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT pb.*, u.username AS created_by_name
			FROM production_batches pb
			LEFT JOIN users u ON u.id = pb.created_by
			ORDER BY pb.created_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const result = await getBatchDetail(req.params.id);
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      batch_name,
      expected_yield,
      start_date,
      notes,
      outputs = [],
    } = req.body;

    await client.query("BEGIN");

    // 1. Insert batch
    const batch = await client.query(
      `INSERT INTO production_batches
        (batch_name, expected_yield, start_date, notes, created_by)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        batch_name,
        expected_yield || null,
        start_date || null,
        notes || null,
        req.user.id,
      ],
    );
    const batchId = batch.rows[0].id;

    // 2. Pre-validate all outputs have active BOMs BEFORE any writes (transaction hygiene)
    const validOutputs = [];
    const missingBomProducts = [];

    for (const output of outputs) {
      if (!output.finished_good_id) continue;

      const finishedGoodId = parseInt(output.finished_good_id);
      const expectedQty = parseFloat(output.expected_quantity) || 1;

      const fgResult = await client.query(
        `SELECT name, expiry_duration_days FROM finished_goods WHERE id = $1`,
        [finishedGoodId],
      );

      if (!fgResult.rows[0]) {
        continue; // skip invalid finished good (will be caught by FK or ignored)
      }

      const fgName = fgResult.rows[0].name;
      const expiryDays = fgResult.rows[0].expiry_duration_days;
      const expiryDate = expiryDays
        ? new Date(Date.now() + expiryDays * 86400000)
            .toISOString()
            .split("T")[0]
        : null;

      // Check BOM existence early
      const bomResult = await client.query(
        `SELECT b.id FROM bom b
          WHERE b.finished_good_id = $1 AND b.is_active = TRUE`,
        [finishedGoodId],
      );

      if (bomResult.rows.length === 0) {
        missingBomProducts.push(fgName || `${finishedGoodId}`);
        continue;
      }

      validOutputs.push({
        finishedGoodId,
        expectedQty,
        expiryDate,
      });
    }

    if (missingBomProducts.length > 0) {
      throw new Error(
        `No active BOM found for produced product(s): ${missingBomProducts.join(", ")}`,
      );
    }

    // 3. Now perform all writes (only for valid outputs with BOMs)
    for (const vo of validOutputs) {
      const { finishedGoodId, expectedQty, expiryDate } = vo;

      const outputResult = await client.query(
        `INSERT INTO batch_outputs
          (batch_id, finished_good_id, expected_quantity, production_date, expiry_date)
          VALUES ($1, $2, $3, CURRENT_DATE, $4)
          RETURNING *`,
        [batchId, finishedGoodId, expectedQty, expiryDate],
      );

      await client.query(`SELECT populate_batch_from_bom($1, $2, $3)`, [
        batchId,
        finishedGoodId,
        expectedQty,
      ]);
    }

    // 4. Validate that sufficient materials exist for this batch (early warning)
    const batchMaterialsCheck = await client.query(
      `SELECT bm.*, rm.name, rm.quantity_in_stock
         FROM batch_materials bm
         JOIN raw_materials rm ON rm.id = bm.material_id
         WHERE bm.batch_id = $1`,
      [batchId],
    );

    const warnings = [];
    for (const mat of batchMaterialsCheck.rows) {
      const required = parseFloat(mat.quantity_used);
      const available = parseFloat(mat.quantity_in_stock);

      if (available < required) {
        warnings.push({
          material: mat.name,
          required: required,
          available: available,
          shortage: required - available,
        });
      }
    }

    if (warnings.length > 0) {
      const warningMsg = warnings
        .map(
          (w) => `${w.material}: need ${w.required}, only have ${w.available}`,
        )
        .join("; ");
      console.warn(
        `[BATCH] Low material warning for batch ${batchId}: ${warningMsg}`,
      );
    }

    // Fetch detail using the transaction client before commit (more reliable)
    const createdBatch = await client.query(
      "SELECT * FROM production_batches WHERE id = $1",
      [batchId],
    );

    const batchMaterials = await client.query(
      `SELECT bm.*, rm.name AS material_name, rm.unit
         FROM batch_materials bm
         JOIN raw_materials rm ON rm.id = bm.material_id
         WHERE bm.batch_id = $1`,
      [batchId],
    );

    const batchOutputs = await client.query(
      `SELECT bo.*, fg.name AS finished_good_name
         FROM batch_outputs bo
         JOIN finished_goods fg ON fg.id = bo.finished_good_id
         WHERE bo.batch_id = $1`,
      [batchId],
    );

    await client.query("COMMIT");

    res.status(201).json({
      ...createdBatch.rows[0],
      materials: batchMaterials.rows,
      outputs: batchOutputs.rows,
      materialWarnings: warnings.length > 0 ? warnings : null,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    next(err);
  } finally {
    client.release();
  }
};

export const complete = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Guard: prevent completing a batch that is already done or cancelled
    const statusCheck = await client.query(
      `SELECT status FROM production_batches WHERE id = $1`,
      [req.params.id],
    );
    const currentStatus = statusCheck.rows[0]?.status;
    if (!currentStatus) {
      throw Object.assign(new Error("Batch not found"), { status: 404 });
    }
    if (currentStatus === "completed") {
      throw Object.assign(new Error("Batch is already completed"), {
        status: 409,
      });
    }
    if (currentStatus === "cancelled") {
      throw Object.assign(new Error("Cannot complete a cancelled batch"), {
        status: 409,
      });
    }

    // req.body.outputs = [{ finished_good_id, actual_quantity }]
    const result = await completeBatch(
      client,
      req.params.id,
      req.body.outputs,
      req.user.id,
    );
    await client.query("COMMIT");
    res.json(result);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    next(err);
  } finally {
    client.release();
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE production_batches SET status = $1 WHERE id = $2 RETURNING *`,
      [req.body.status, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
