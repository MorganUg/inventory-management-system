/**
 * AI Recommendations Engine
 *
 * Generates intelligent reorder / production recommendations.
 * Separated module for maintainability and future upgrades.
 */

/**
 * Generates reorder / production recommendations based on forecast.
 *
 * @param {import('./forecasting.js').ForecastResult} forecast
 * @returns {Object[]}
 */
export function generateReorderRecommendations(forecast) {
  const recommendations = [];

  if (!forecast || forecast.forecast_next_4_weeks === 0) {
    return recommendations;
  }

  const currentStock = forecast.current_stock;
  const avgWeeklyDemand = forecast.recent_avg || forecast.weekly_avg;
  const fourWeekForecast = forecast.forecast_next_4_weeks;

  // Dynamic reorder point (no schema change needed)
  const recommendedCoverWeeks = 3;
  const dynamicReorderPoint = Math.ceil(
    avgWeeklyDemand * recommendedCoverWeeks,
  );

  const projectedStockAfterForecast = currentStock - fourWeekForecast;

  if (projectedStockAfterForecast < dynamicReorderPoint) {
    const shortfall = Math.max(0, dynamicReorderPoint - currentStock);
    const urgency =
      projectedStockAfterForecast < 0
        ? "high"
        : projectedStockAfterForecast < dynamicReorderPoint * 0.5
          ? "medium"
          : "low";

    const actionDate = new Date();
    actionDate.setDate(
      actionDate.getDate() +
        Math.ceil((currentStock / Math.max(1, avgWeeklyDemand)) * 7),
    );

    recommendations.push({
      finished_good_id: forecast.finished_good_id,
      name: forecast.name,
      type: "production_recommendation",
      urgency_level: urgency,
      recommended_action_date: actionDate.toISOString().split("T")[0],
      current_stock: currentStock,
      forecasted_demand_4_weeks: fourWeekForecast,
      suggested_quantity: Math.max(shortfall, Math.ceil(avgWeeklyDemand * 2)),
      reason: `Projected stock after forecast: ${projectedStockAfterForecast}. Dynamic reorder point: ${dynamicReorderPoint}.`,
    });
  }

  return recommendations;
}
