import pool from "../config/db.js";
import { dispatchGoods } from "../services/dispatchService.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.*, fg.name AS product, c.name AS customer,
                    fg.price_per_unit AS price_per_unit,
                    u.username AS dispatched_by_name
             FROM dispatches d
             JOIN finished_goods fg ON fg.id = d.finished_good_id
             LEFT JOIN customers c ON c.id = d.customer_id
             LEFT JOIN users u ON u.id = d.dispatched_by
             ORDER BY d.dispatched_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await dispatchGoods(client, req.body, req.user.id);
    await client.query("COMMIT");
    res.status(201).json(result);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};
