import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { authorise } from "../middleware/roles.js";
import {
  getForecast,
  getInsights,
  getRecommendations,
  getAISummary,
} from "../controllers/ai.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorise("admin", "manager"));

// AI Forecasting & Insights
router.get("/forecast/:id", getForecast);
router.get("/insights/:id", getInsights);
router.get("/recommendations/:id", getRecommendations);
router.get("/summary/:id", getAISummary);

export default router;
