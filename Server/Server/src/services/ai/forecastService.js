/**
 * AI Forecasting Orchestrator
 *
 * Combines data access layer + pure forecasting engine.
 * This is the main entry point for demand forecasting.
 */

import {
  getWeeklyDemandHistory,
  getProductInfo,
} from './demandData.js';

import { generateDemandForecast } from './forecasting.js';

/**
 * Generates demand forecast for a single finished good.
 *
 * @param {number} finishedGoodId
 * @param {Object} [options]
 * @returns {Promise<import('./forecasting.js').ForecastResult>}
 */
export async function getDemandForecast(finishedGoodId, options = {}) {
  const [product, weeklyData] = await Promise.all([
    getProductInfo(finishedGoodId),
    getWeeklyDemandHistory(finishedGoodId, options),
  ]);

  return generateDemandForecast({
    finishedGoodId: product.id,
    name: product.name,
    unit: product.unit,
    currentStock: product.quantity_in_stock,
    weeklyData,
  });
}
