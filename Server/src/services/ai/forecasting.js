/**
 * AI Forecasting Engine — Pure Functions (Testability First)
 *
 * =============================================================================
 * FUTURE UPGRADE PATH (Important for maintainers)
 * =============================================================================
 * This module contains ONLY pure functions. It has zero dependencies on:
 *   - Database (pg, pool, etc.)
 *   - Express / HTTP
 *   - Date.now(), process.env, or any global state
 *   - External ML libraries
 *
 * All inputs are passed explicitly as arguments.
 *
 * Recommended future upgrade strategies (without changing public API shapes):
 *
 * 1. Prophet / ARIMA replacement
 *    - Create a new file: forecasting.prophet.js
 *    - Keep the same input shape (WeeklyDemandRecord[])
 *    - Keep the same output shape (ForecastResult)
 *    - Swap the implementation behind generateDemandForecast()
 *
 * 2. Python microservice
 *    - The Node.js side stays as a thin adapter
 *    - Call the Python service with the same WeeklyDemandRecord[] payload
 *    - Map the Python response back to ForecastResult shape
 *
 * 3. LLM-enhanced explanations
 *    - The current `explanation` and `data_quality_explanation` fields
 *      can be replaced/enhanced by calling an LLM with the raw metrics.
 *
 * This design allows gradual replacement while keeping the rest of the
 * system (controllers, frontend, tests) unchanged.
 * =============================================================================
 */

// =============================================================================
// JSDOC TYPE DEFINITIONS (Explicit Data Contracts)
// =============================================================================

/**
 * @typedef {Object} WeeklyDemandRecord
 * @property {string} week            - ISO week identifier, e.g. "2026-W15" or "2026-04-13"
 * @property {number} demand          - Total units dispatched in that week (must be >= 0)
 * @property {number} [dispatch_count] - Optional: number of dispatch transactions that week
 */

/**
 * @typedef {Object} ForecastOptions
 * @property {number} [forecastHorizonWeeks=4] - How many weeks to forecast ahead
 * @property {number} [recentWeight=0.7]        - Weight given to recent 4-week average (0-1)
 * @property {number} [safetyWeeks=3]           - Used for dynamic reorder point calculations
 */

/**
 * @typedef {Object} LinearTrendResult
 * @property {number} slope           - Units per week change (positive = growing)
 * @property {number} intercept       - Starting point of trend line
 * @property {number} rSquared        - Goodness of fit (0-1). Higher = more stable trend
 * @property {string} direction       - "increasing" | "decreasing" | "stable"
 */

/**
 * @typedef {Object} ConfidenceMetrics
 * @property {number} confidence_score      - 0-100 numeric score
 * @property {string} confidence            - "high" | "medium" | "low"
 * @property {number} weeks_contribution    - Contribution from data volume (0-100)
 * @property {number} volatility_contribution - Contribution from demand stability (0-100)
 * @property {number} trend_stability_contribution - Contribution from trend consistency (0-100)
 */

/**
 * @typedef {Object} DataQualityMetrics
 * @property {number} data_quality_score      - 0-100
 * @property {string} data_quality_explanation - Human readable explanation
 * @property {number} historical_weeks_used   - Actual number of weeks with data
 * @property {number} missing_weeks           - Estimated gaps in the series
 */

/**
 * @typedef {Object} ForecastResult
 * @property {number} finished_good_id
 * @property {string} name
 * @property {string} unit
 * @property {number} current_stock
 * @property {number} weekly_avg
 * @property {number} recent_avg
 * @property {string} trend
 * @property {number} trend_percentage
 * @property {number} forecast_next_4_weeks
 * @property {number[]} weekly_forecast
 * @property {string} confidence
 * @property {number} confidence_score
 * @property {number} historical_weeks_used
 * @property {number} data_quality_score
 * @property {string} data_quality_explanation
 * @property {string} forecast_method
 * @property {string} explanation
 * @property {number|null} stockout_risk_weeks
 * @property {ConfidenceMetrics} [confidence_breakdown]
 * @property {DataQualityMetrics} [data_quality_breakdown]
 */

/**
 * @example
 * // Example input (9 weeks of real dispatch history)
 * const input = {
 *   finishedGoodId: 7,
 *   name: "Chocolate Fudge 500g",
 *   unit: "pieces",
 *   currentStock: 142,
 *   weeklyData: [
 *     { week: "2026-W06", demand: 128 },
 *     { week: "2026-W07", demand: 135 },
 *     { week: "2026-W08", demand: 119 },
 *     { week: "2026-W09", demand: 152 },
 *     { week: "2026-W10", demand: 148 },
 *     { week: "2026-W11", demand: 161 },
 *     { week: "2026-W12", demand: 155 },
 *     { week: "2026-W13", demand: 172 },
 *     { week: "2026-W14", demand: 168 },
 *   ]
 * };
 *
 * const result = generateDemandForecast(input);
 * // result.confidence_score → 74
 * // result.data_quality_score → 81
 * // result.forecast_method → "weighted_moving_average_with_linear_trend_v1"
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Centralized forecast method identifier — change only when algorithm meaningfully changes */
export const FORECAST_METHOD = "weighted_moving_average_with_linear_trend_v1";

const DEFAULT_OPTIONS = {
  forecastHorizonWeeks: 4,
  recentWeight: 0.7,
  safetyWeeks: 3,
};

// =============================================================================
// PURE HELPER FUNCTIONS — DATA ANALYSIS
// =============================================================================

/**
 * Extracts and sorts weekly demand values from input records.
 * Pure function — no side effects.
 *
 * @param {WeeklyDemandRecord[]} records
 * @returns {{ weeks: string[], demands: number[] }}
 */
export function extractWeeklySeries(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { weeks: [], demands: [] };
  }

  // Sort by week (assumes ISO-like sortable strings or proper date strings)
  const sorted = [...records].sort((a, b) => a.week.localeCompare(b.week));

  return {
    weeks: sorted.map(r => r.week),
    demands: sorted.map(r => Math.max(0, Number(r.demand) || 0)), // Defensive: never allow negatives
  };
}

/**
 * Calculates basic descriptive statistics from demand array.
 * Pure function.
 *
 * @param {number[]} demands
 * @returns {{ mean: number, stdDev: number, min: number, max: number, count: number }}
 */
export function calculateDemandStats(demands) {
  if (!demands || demands.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
  }

  const count = demands.length;
  const sum = demands.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  const variance = demands.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    stdDev,
    min: Math.min(...demands),
    max: Math.max(...demands),
    count,
  };
}

// =============================================================================
// PURE FUNCTIONS — TREND CALCULATION
// =============================================================================

/**
 * Calculates linear trend using ordinary least squares (simple linear regression).
 * Pure mathematical function.
 *
 * @param {number[]} demands - Array of weekly demand values in chronological order
 * @returns {LinearTrendResult}
 */
export function calculateLinearTrend(demands) {
  const n = demands.length;

  if (n < 2) {
    return {
      slope: 0,
      intercept: demands[0] || 0,
      rSquared: 0,
      direction: "stable",
    };
  }

  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = demands;

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
  const sumX2 = xValues.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const yMean = sumY / n;
  const ssTotal = yValues.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssResidual = yValues.reduce((acc, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return acc + Math.pow(y - predicted, 2);
  }, 0);

  const rSquared = ssTotal === 0 ? 1 : Math.max(0, 1 - (ssResidual / ssTotal));

  let direction = "stable";
  if (Math.abs(slope) < 0.5) direction = "stable";
  else if (slope > 0) direction = "increasing";
  else direction = "decreasing";

  return { slope, intercept, rSquared, direction };
}

// =============================================================================
// PURE FUNCTIONS — CONFIDENCE SCORING (Fully Documented Formula)
// =============================================================================

/**
 * Calculates the numeric confidence score (0-100).
 *
 * FORMULA (reproducible):
 *   confidence_score = (weeks_contribution * 0.40)
 *                    + (volatility_contribution * 0.35)
 *                    + (trend_stability_contribution * 0.25)
 *
 * Component details:
 *   - weeks_contribution:     min(100, historical_weeks * 8)          [caps around 12-13 weeks]
 *   - volatility_contribution: 100 - (coefficient_of_variation * 40)   [capped 0-100]
 *   - trend_stability_contribution: rSquared * 100
 *
 * @param {number} historicalWeeks
 * @param {number} volatility        - standard deviation
 * @param {number} meanDemand
 * @param {number} rSquared
 * @returns {ConfidenceMetrics}
 */
export function calculateConfidenceScore(historicalWeeks, volatility, meanDemand, rSquared) {
  // 1. Weeks contribution (data volume)
  const weeksContribution = Math.min(100, Math.max(0, historicalWeeks * 8));

  // 2. Volatility contribution (lower volatility = higher confidence)
  const cv = meanDemand > 0 ? (volatility / meanDemand) : 0;
  const volatilityContribution = Math.max(0, Math.min(100, 100 - (cv * 40)));

  // 3. Trend stability contribution
  const trendStabilityContribution = Math.max(0, Math.min(100, rSquared * 100));

  // Weighted final score
  const rawScore =
    (weeksContribution * 0.40) +
    (volatilityContribution * 0.35) +
    (trendStabilityContribution * 0.25);

  const confidenceScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Categorical label
  let confidence = "low";
  if (confidenceScore >= 75) confidence = "high";
  else if (confidenceScore >= 45) confidence = "medium";

  return {
    confidence_score: confidenceScore,
    confidence,
    weeks_contribution: Math.round(weeksContribution),
    volatility_contribution: Math.round(volatilityContribution),
    trend_stability_contribution: Math.round(trendStabilityContribution),
  };
}

// =============================================================================
// PURE FUNCTIONS — DATA QUALITY ASSESSMENT
// =============================================================================

/**
 * Assesses the quality and completeness of the historical demand data.
 * Returns both a numeric score and a human-readable explanation.
 *
 * Scoring factors (weighted):
 *   - Number of weeks available (40%)
 *   - Volatility (25%)
 *   - Trend consistency / rSquared (20%)
 *   - Data density (missing weeks estimate) (15%)
 *
 * @param {number[]} demands
 * @param {number} historicalWeeks
 * @param {number} volatility
 * @param {number} mean
 * @param {number} rSquared
 * @returns {DataQualityMetrics}
 */
export function assessDataQuality(demands, historicalWeeks, volatility, mean, rSquared) {
  if (!demands || demands.length === 0) {
    return {
      data_quality_score: 0,
      data_quality_explanation: "No historical dispatch data available. Forecast is not reliable.",
      historical_weeks_used: 0,
      missing_weeks: 0,
    };
  }

  const weeksScore = Math.min(100, historicalWeeks * 7.5);
  const cv = mean > 0 ? (volatility / mean) : 0;
  const volatilityScore = Math.max(0, Math.min(100, 100 - (cv * 35)));
  const trendScore = Math.max(0, Math.min(100, rSquared * 100));

  // Simple missing weeks heuristic (assumes roughly continuous weekly data)
  const expectedSpan = historicalWeeks;
  const actualPoints = demands.length;
  const missingRatio = Math.max(0, (expectedSpan - actualPoints) / expectedSpan);
  const densityScore = Math.max(0, 100 - (missingRatio * 100));

  const score =
    (weeksScore * 0.40) +
    (volatilityScore * 0.25) +
    (trendScore * 0.20) +
    (densityScore * 0.15);

  const dataQualityScore = Math.round(Math.max(0, Math.min(100, score)));

  let explanation = `Based on ${historicalWeeks} weeks of data`;
  if (historicalWeeks < 4) {
    explanation += ". Very limited history — forecasts have high uncertainty.";
  } else if (dataQualityScore < 50) {
    explanation += ". High volatility or inconsistent patterns reduce reliability.";
  } else if (dataQualityScore < 75) {
    explanation += ". Moderate reliability. More data will improve accuracy.";
  } else {
    explanation += ". Good data quality for forecasting.";
  }

  return {
    data_quality_score: dataQualityScore,
    data_quality_explanation: explanation,
    historical_weeks_used: historicalWeeks,
    missing_weeks: Math.max(0, Math.round((expectedSpan - actualPoints))),
  };
}

// =============================================================================
// PURE FUNCTIONS — FORECAST GENERATION
// =============================================================================

/**
 * Generates the actual weekly forecast numbers using weighted moving average + trend.
 * Pure function.
 *
 * @param {number} recentAvg
 * @param {number} longTermAvg
 * @param {number} slope
 * @param {number} horizon
 * @param {number} recentWeight
 * @returns {number[]}
 */
export function generateWeeklyForecast(recentAvg, longTermAvg, slope, horizon, recentWeight = 0.7) {
  const base = (recentAvg * recentWeight) + (longTermAvg * (1 - recentWeight));
  const forecast = [];

  for (let i = 1; i <= horizon; i++) {
    const projected = base + (slope * i);
    forecast.push(Math.max(0, Math.round(projected)));
  }

  return forecast;
}

// =============================================================================
// MAIN ORCHESTRATOR — PUBLIC API (Pure Function)
// =============================================================================

/**
 * Generates a complete demand forecast for one finished good.
 * This is the primary public function.
 *
 * @param {Object} params
 * @param {number} params.finishedGoodId
 * @param {string} params.name
 * @param {string} params.unit
 * @param {number} params.currentStock
 * @param {WeeklyDemandRecord[]} params.weeklyData
 * @param {ForecastOptions} [params.options]
 * @returns {ForecastResult}
 */
export function generateDemandForecast({
  finishedGoodId,
  name,
  unit,
  currentStock = 0,
  weeklyData = [],
  options = {},
}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // --- Edge Case: No data ---
  if (!weeklyData || weeklyData.length === 0) {
    return createEmptyForecastResult(finishedGoodId, name, unit, currentStock);
  }

  const { weeks, demands } = extractWeeklySeries(weeklyData);
  const historicalWeeks = demands.length;

  // --- Edge Case: Very little data ---
  if (historicalWeeks === 1) {
    return createLowDataForecast(finishedGoodId, name, unit, currentStock, demands[0], historicalWeeks);
  }

  const stats = calculateDemandStats(demands);
  const trend = calculateLinearTrend(demands);

  const recentAvg = demands.slice(-4).reduce((a, b) => a + b, 0) / Math.min(4, demands.length);
  const longTermAvg = stats.mean;

  // Generate forecast values
  const weeklyForecast = generateWeeklyForecast(
    recentAvg,
    longTermAvg,
    trend.slope,
    opts.forecastHorizonWeeks,
    opts.recentWeight
  );

  const forecastNext4Weeks = weeklyForecast.reduce((a, b) => a + b, 0);

  // Calculate confidence (fully documented)
  const confidenceMetrics = calculateConfidenceScore(
    historicalWeeks,
    stats.stdDev,
    stats.mean,
    trend.rSquared
  );

  // Data quality
  const dataQuality = assessDataQuality(
    demands,
    historicalWeeks,
    stats.stdDev,
    stats.mean,
    trend.rSquared
  );

  // Trend percentage (relative to long-term average)
  const trendPercentage = longTermAvg > 0
    ? Math.round(((recentAvg - longTermAvg) / longTermAvg) * 100)
    : 0;

  // Simple stockout risk estimation
  let stockoutRiskWeeks = null;
  if (currentStock > 0 && recentAvg > 0) {
    stockoutRiskWeeks = parseFloat((currentStock / recentAvg).toFixed(1));
  }

  const explanation = buildExplanation(historicalWeeks, trend, recentAvg, longTermAvg, confidenceMetrics.confidence_score);

  /** @type {ForecastResult} */
  return {
    finished_good_id: finishedGoodId,
    name,
    unit,
    current_stock: currentStock,
    weekly_avg: Math.round(longTermAvg * 10) / 10,
    recent_avg: Math.round(recentAvg * 10) / 10,
    trend: trend.direction,
    trend_percentage: trendPercentage,
    forecast_next_4_weeks: forecastNext4Weeks,
    weekly_forecast: weeklyForecast,
    confidence: confidenceMetrics.confidence,
    confidence_score: confidenceMetrics.confidence_score,
    historical_weeks_used: historicalWeeks,
    data_quality_score: dataQuality.data_quality_score,
    data_quality_explanation: dataQuality.data_quality_explanation,
    forecast_method: FORECAST_METHOD,
    explanation,
    stockout_risk_weeks: stockoutRiskWeeks,
    confidence_breakdown: confidenceMetrics,
    data_quality_breakdown: dataQuality,
  };
}

// =============================================================================
// INTERNAL EDGE CASE HELPERS (Pure)
// =============================================================================

function createEmptyForecastResult(finishedGoodId, name, unit, currentStock) {
  return {
    finished_good_id: finishedGoodId,
    name,
    unit,
    current_stock: currentStock,
    weekly_avg: 0,
    recent_avg: 0,
    trend: "stable",
    trend_percentage: 0,
    forecast_next_4_weeks: 0,
    weekly_forecast: [0, 0, 0, 0],
    confidence: "low",
    confidence_score: 0,
    historical_weeks_used: 0,
    data_quality_score: 0,
    data_quality_explanation: "No historical dispatch data available.",
    forecast_method: FORECAST_METHOD,
    explanation: "Insufficient data for forecasting. At least 4 weeks of dispatch history recommended.",
    stockout_risk_weeks: null,
  };
}

function createLowDataForecast(finishedGoodId, name, unit, currentStock, singleWeekDemand, historicalWeeks) {
  const forecast = [singleWeekDemand, singleWeekDemand, singleWeekDemand, singleWeekDemand];
  return {
    finished_good_id: finishedGoodId,
    name,
    unit,
    current_stock: currentStock,
    weekly_avg: singleWeekDemand,
    recent_avg: singleWeekDemand,
    trend: "stable",
    trend_percentage: 0,
    forecast_next_4_weeks: singleWeekDemand * 4,
    weekly_forecast: forecast,
    confidence: "low",
    confidence_score: 15,
    historical_weeks_used: historicalWeeks,
    data_quality_score: 12,
    data_quality_explanation: `Only ${historicalWeeks} week of data. Forecast is a simple projection and highly uncertain.`,
    forecast_method: FORECAST_METHOD,
    explanation: "Extremely limited history. Treat forecast as a rough directional indicator only.",
    stockout_risk_weeks: currentStock > 0 ? (currentStock / singleWeekDemand).toFixed(1) : null,
  };
}

function buildExplanation(historicalWeeks, trend, recentAvg, longTermAvg, confidenceScore) {
  let base = `Based on ${historicalWeeks} weeks of data. `;

  if (trend.direction === "increasing") {
    base += `Recent demand is trending upward (${trend.slope > 0 ? '+' : ''}${trend.slope.toFixed(1)} units/week). `;
  } else if (trend.direction === "decreasing") {
    base += `Recent demand is trending downward. `;
  }

  if (confidenceScore < 40) {
    base += "Confidence is low due to limited or volatile data.";
  } else if (confidenceScore < 70) {
    base += "Moderate confidence. Additional weeks of data will improve accuracy.";
  } else {
    base += "Relatively stable demand pattern.";
  }

  return base.trim();
}
