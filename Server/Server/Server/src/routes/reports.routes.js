import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { authorise } from "../middleware/roles.js";
import {
  getProductionReport,
  getStockReport,
  getDispatchReport,
  getConsumptionReport,
  getProductionChart,
  getDispatchChart,
  getTopProductsChart,
  getStockLevelsChart,
} from "../controllers/reports.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorise("admin", "manager"));

// Reports
router.get("/production", getProductionReport);
router.get("/stock", getStockReport);
router.get("/dispatches", getDispatchReport);
router.get("/consumption", getConsumptionReport);

// Chart
router.get("/charts/production", getProductionChart);
router.get("/charts/dispatches", getDispatchChart);
router.get("/charts/top-products", getTopProductsChart);
router.get("/charts/stock-levels", getStockLevelsChart);

export default router;
