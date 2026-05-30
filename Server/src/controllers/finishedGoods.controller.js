import pool from "../config/db.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
      fg.*,
      c.name AS category,
      COALESCE(SUM(d.quantity_dispatched), 0) AS total_dispatched
      FROM finished_goods fg
      LEFT JOIN categories c ON c.id = fg.category_id
      LEFT JOIN dispatches d ON d.finished_good_id = fg.id AND d.status = 'dispatched'
      GROUP BY fg.id, c.name
      ORDER BY fg.name`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const good = await pool.query(
      `SELECT fg.*, c.name AS category
      FROM finished_goods fg
      LEFT JOIN categories c ON c.id = fg.category_id
      WHERE fg.id = $1`,
      [req.params.id],
    );
    if (!good.rows[0])
      return res.status(404).json({ error: "Finished good not found" });

    // Production history across all batches
    const batches = await pool.query(
      `SELECT bo.*, pb.batch_name, pb.status, pb.start_date, pb.end_date
        FROM batch_outputs bo
        JOIN production_batches pb ON pb.id = bo.batch_id
        WHERE bo.finished_good_id = $1
        ORDER BY bo.production_date DESC`,
      [req.params.id],
    );

    // Active BOM if it exists
    const bom = await pool.query(
      `SELECT b.id, b.version, b.is_active, b.notes,
      json_agg(json_build_object(
          'material', rm.name,
          'quantity_per_unit', bi.quantity_per_unit,
          'unit', bi.unit
      )) AS ingredients
        FROM bom b
        JOIN bom_items bi ON bi.bom_id = b.id
        JOIN raw_materials rm ON rm.id = bi.material_id
        WHERE b.finished_good_id = $1 AND b.is_active = TRUE
        GROUP BY b.id`,
      [req.params.id],
    );

    res.json({
      ...good.rows[0],
      production_history: batches.rows,
      active_bom: bom.rows[0] || null,
    });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { name, unit, price_per_unit, category_id, expiry_duration_days } =
      req.body;

    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    const result = await pool.query(
      `INSERT INTO finished_goods (name, unit, price_per_unit, category_id, expiry_duration_days)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        name,
        unit || "pieces",
        price_per_unit || 0,
        category_id || null,
        expiry_duration_days || null,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { name, unit, price_per_unit, category_id, expiry_duration_days } =
      req.body;

    const result = await pool.query(
      `UPDATE finished_goods
      SET name                 = COALESCE($1, name),
          unit                 = COALESCE($2, unit),
          price_per_unit       = COALESCE($3, price_per_unit),
          category_id          = COALESCE($4, category_id),
          expiry_duration_days = COALESCE($5, expiry_duration_days)
      WHERE id = $6 RETURNING *`,
      [
        name || null,
        unit || null,
        price_per_unit ?? null,
        category_id || null,
        expiry_duration_days || null,
        req.params.id,
      ],
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Finished good not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    // Check if product has stock or dispatch history
    const check = await pool.query(
      `SELECT quantity_in_stock FROM finished_goods WHERE id = $1`,
      [req.params.id],
    );
    if (!check.rows[0])
      return res.status(404).json({ error: "Finished good not found" });

    if (check.rows[0].quantity_in_stock > 0) {
      return res.status(409).json({
        error:
          "Cannot delete a product with stock remaining. Dispatch or adjust stock first.",
      });
    }

    const result = await pool.query(
      `DELETE FROM finished_goods WHERE id = $1 RETURNING id`,
      [req.params.id],
    );
    res.json({ message: "Finished good deleted successfully" });
  } catch (err) {
    next(err);
  }
};
