import {
  getDemandForecast,
  generateInsights,
  generateReorderRecommendations,
} from '../services/ai/index.js';

export const getForecast = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { weeks } = req.query;

    const options = {};
    if (weeks) options.weeksBack = parseInt(weeks, 10);

    const forecast = await getDemandForecast(parseInt(id, 10), options);
    res.json(forecast);
  } catch (err) {
    next(err);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const { id } = req.params;
    const forecast = await getDemandForecast(parseInt(id, 10));
    const insights = await generateInsights(parseInt(id, 10), forecast);

    res.json({ insights });
  } catch (err) {
    next(err);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const forecast = await getDemandForecast(parseInt(id, 10));
    const recommendations = generateReorderRecommendations(forecast);

    res.json({ recommendations });
  } catch (err) {
    next(err);
  }
};

// Combined endpoint - useful for the AI tab in Reports
export const getAISummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { weeks } = req.query;

    const options = {};
    if (weeks) options.weeksBack = parseInt(weeks, 10);

    const forecast = await getDemandForecast(parseInt(id, 10), options);
    const [insights, recommendations] = await Promise.all([
      generateInsights(parseInt(id, 10), forecast),
      Promise.resolve(generateReorderRecommendations(forecast)),
    ]);

    res.json({
      forecast,
      insights,
      recommendations,
    });
  } catch (err) {
    next(err);
  }
};
