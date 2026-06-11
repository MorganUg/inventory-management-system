import pool from "../config/db.js";

export const getAll = async (req, res, next) => {
  try {
    const {
      item_type,
      movement_type,
      item_id,
      from,
      to,
      limit = 100,
      offset = 0,
    } = req.query;

    // Build dynamic filters
    const conditions = [];
    const values = [];
    let idx = 1;

    if (item_type) {
      conditions.push(`sm.item_type = $${idx++}`);
      values.push(item_type);
    }
    if (movement_type) {
      conditions.push(`sm.movement_type = $${idx++}`);
      values.push(movement_type);
    }
    if (item_id) {
      conditions.push(`sm.item_id = $${idx++}`);
      values.push(item_id);
    }
    if (from) {
      conditions.push(`sm.created_at >= $${idx++}`);
      values.push(from);
    }
    if (to) {
      conditions.push(`sm.created_at <= $${idx++}`);
      values.push(to);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(
      `SELECT
                sm.*,
                CASE
                    WHEN sm.item_type = 'raw_material'  THEN rm.name
                    WHEN sm.item_type = 'finished_good' THEN fg.name
                END AS item_name,
                CASE
                    WHEN sm.item_type = 'raw_material'  THEN rm.unit
                    WHEN sm.item_type = 'finished_good' THEN fg.unit
                END AS item_unit,
                u.username AS created_by_name
             FROM stock_movements sm
             LEFT JOIN raw_materials rm ON sm.item_type = 'raw_material' AND rm.id = sm.item_id
             LEFT JOIN finished_goods fg ON sm.item_type = 'finished_good' AND fg.id = sm.item_id
             LEFT JOIN users u ON u.id = sm.created_by
             ${where}
             ORDER BY sm.created_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
      values,
    );

    // Total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM stock_movements sm ${where}`,
      values.slice(0, -2),
    );

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
                sm.*,
                CASE
                    WHEN sm.item_type = 'raw_material'  THEN rm.name
                    WHEN sm.item_type = 'finished_good' THEN fg.name
                END AS item_name,
                u.username AS created_by_name
             FROM stock_movements sm
             LEFT JOIN raw_materials rm ON sm.item_type = 'raw_material' AND rm.id = sm.item_id
             LEFT JOIN finished_goods fg ON sm.item_type = 'finished_good' AND fg.id = sm.item_id
             LEFT JOIN users u ON u.id = sm.created_by
             WHERE sm.id = $1`,
      [req.params.id],
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Movement not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Summary: total in vs out per item
export const getSummary = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
                sm.item_type,
                sm.item_id,
                CASE
                    WHEN sm.item_type = 'raw_material'  THEN rm.name
                    WHEN sm.item_type = 'finished_good' THEN fg.name
                END AS item_name,
                CASE
                    WHEN sm.item_type = 'raw_material'  THEN rm.unit
                    WHEN sm.item_type = 'finished_good' THEN fg.unit
                END AS unit,
                SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END) AS total_in,
                SUM(CASE WHEN sm.quantity < 0 THEN sm.quantity ELSE 0 END) AS total_out,
                SUM(sm.quantity) AS net
             FROM stock_movements sm
             LEFT JOIN raw_materials rm ON sm.item_type = 'raw_material' AND rm.id = sm.item_id
             LEFT JOIN finished_goods fg ON sm.item_type = 'finished_good' AND fg.id = sm.item_id
             GROUP BY sm.item_type, sm.item_id, rm.name, fg.name, rm.unit, fg.unit
             ORDER BY sm.item_type, item_name`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};
