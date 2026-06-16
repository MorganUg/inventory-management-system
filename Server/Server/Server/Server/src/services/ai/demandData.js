/**
 * AI Module - Demand Data Access Layer
 *
 * This is the ONLY file in the AI module that should touch the database.
 * All forecasting logic lives in forecasting.js (pure functions).
 */

import pool from '../../config/db.js';

/**
 * @typedef {Object} WeeklyDemandRecord
 * @property {string} week
 * @property {number} demand
 */

/**
 * @typedef {Object} ProductInfo
 * @property {number} id
 * @property {string} name
 * @property {string} unit
 * @property {number} quantity_in_stock
 */

/**
 * Fetches weekly aggregated dispatch demand for a specific finished good.
 * Applies strict filters: only 'dispatched' status and positive quantities.
 *
 * @param {number} finishedGoodId
 * @param {Object} [options]
 * @param {number} [options.weeksBack=16]
 * @param {string} [options.fromDate]
 * @param {string} [options.toDate]
 * @returns {Promise<WeeklyDemandRecord[]>}
 */
export async function getWeeklyDemandHistory(finishedGoodId, options = {}) {
  const { weeksBack = 16, fromDate, toDate } = options;

  const values = [finishedGoodId];
  let idx = 2;

  let dateFilter = '';
  if (fromDate) {
    dateFilter += ` AND d.dispatched_at >= $${idx++}`;
    values.push(fromDate);
  }
  if (toDate) {
    dateFilter += ` AND d.dispatched_at <= $${idx++}`;
    values.push(toDate);
  }

  if (!fromDate && !toDate) {
    dateFilter += ` AND d.dispatched_at >= NOW() - INTERVAL '${weeksBack} weeks'`;
  }

  const query = `
    SELECT
      DATE_TRUNC('week', d.dispatched_at)::date AS week,
      SUM(d.quantity_dispatched)::numeric AS demand
    FROM dispatches d
    WHERE d.finished_good_id = $1
      AND d.status = 'dispatched'
      AND d.quantity_dispatched > 0
      ${dateFilter}
    GROUP BY DATE_TRUNC('week', d.dispatched_at)
    ORDER BY week ASC
  `;

  const result = await pool.query(query, values);

  return result.rows.map(row => ({
    week: row.week.toISOString().split('T')[0],
    demand: Number(row.demand),
  }));
}

/**
 * Gets basic product information + current stock for forecasting.
 *
 * @param {number} finishedGoodId
 * @returns {Promise<ProductInfo>}
 */
export async function getProductInfo(finishedGoodId) {
  const result = await pool.query(
    `SELECT id, name, unit, quantity_in_stock
     FROM finished_goods
     WHERE id = $1`,
    [finishedGoodId]
  );

  if (result.rows.length === 0) {
    const error = new Error(`Finished good with id ${finishedGoodId} not found`);
    error.status = 404;
    throw error;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    quantity_in_stock: Number(row.quantity_in_stock),
  };
}

/**
 * Returns all active finished goods with current stock.
 * Useful for future bulk forecasting features.
 *
 * @returns {Promise<ProductInfo[]>}
 */
export async function getAllActiveFinishedGoods() {
  const result = await pool.query(
    `SELECT id, name, unit, quantity_in_stock
     FROM finished_goods
     ORDER BY name ASC`
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    unit: row.unit,
    quantity_in_stock: Number(row.quantity_in_stock),
  }));
}
