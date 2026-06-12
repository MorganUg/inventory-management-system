/**
 * AI Insights Engine
 *
 * Generates smart, actionable insights from forecast results and data.
 * Separated for future replacement / enhancement (e.g. with LLM).
 */

import { getWeeklyDemandHistory } from './demandData.js';

/**
 * Generates AI-powered insights for a finished good.
 *
 * @param {number} finishedGoodId
 * @param {import('./forecasting.js').ForecastResult} [forecast]
 * @returns {Promise<Array>}
 */
export async function generateInsights(finishedGoodId, forecast = null) {
  const insights = [];

  // If forecast was not provided, we can fetch minimal data
  let currentForecast = forecast;

  if (!currentForecast) {
    // In real usage this would be passed in, but allow standalone call
    const weeklyData = await getWeeklyDemandHistory(finishedGoodId, { weeksBack: 8 });
    // We would normally call forecastService here, but to avoid circular deps we keep it light for now
  }

  if (currentForecast) {
    // Forecast Accuracy Warning
    if (currentForecast.historical_weeks_used < 4) {
      insights.push({
        id: `accuracy_warning_${finishedGoodId}`,
        type: 'forecast_accuracy_warning',
        severity: 'medium',
        title: 'Low forecast reliability',
        message: `Forecast reliability is low because only ${currentForecast.historical_weeks_used} weeks of historical data exist.`,
        finished_good_id: finishedGoodId,
        suggested_action: 'Collect more dispatch history before making major production decisions.',
      });
    }

    // Stockout Risk
    if (currentForecast.stockout_risk_weeks !== null && currentForecast.stockout_risk_weeks < 3) {
      insights.push({
        id: `stockout_risk_${finishedGoodId}`,
        type: 'stockout_risk',
        severity: currentForecast.stockout_risk_weeks < 1.5 ? 'high' : 'medium',
        title: 'Stockout risk detected',
        message: `At current rate, stock may run out in approximately ${currentForecast.stockout_risk_weeks} weeks.`,
        finished_good_id: finishedGoodId,
        suggested_action: 'Consider scheduling production soon.',
      });
    }

    // Rising Demand
    if (currentForecast.trend === 'increasing' && currentForecast.trend_percentage > 15) {
      insights.push({
        id: `rising_demand_${finishedGoodId}`,
        type: 'rising_demand',
        severity: 'low',
        title: 'Rising demand trend',
        message: `Demand for this product has increased by ${currentForecast.trend_percentage}% recently.`,
        finished_good_id: finishedGoodId,
        suggested_action: 'Review production capacity and raw material availability.',
      });
    }
  }

  return insights;
}
