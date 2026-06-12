import express from "express";
import cors from "cors";
import helmet from "helmet"; // Security middleware
import morgan from "morgan"; // Logging middleware

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import supplierRoutes from "./routes/suppliers.routes.js";
import customerRoutes from "./routes/customers.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import rawMaterialRoutes from "./routes/rawMaterials.routes.js";
import restockRoutes from "./routes/restocks.routes.js";
import bomRoutes from "./routes/bom.routes.js";
import batchRoutes from "./routes/batches.routes.js";
import finishedGoodRoutes from "./routes/finishedGoods.routes.js";
import dispatchRoutes from "./routes/dispatches.routes.js";
import stockMovementRoutes from "./routes/stockMovements.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import reportsRoutes from "./routes/reports.routes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"]; // Default to React dev server

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow non-browser clients
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin} is not allowed`));
      }
    },
    credentials: true,
  }),
); // React dev server
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api", apiLimiter); // Apply to ll API routes

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/restocks", restockRoutes);
app.use("/api/bom", bomRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/finished-goods", finishedGoodRoutes);
app.use("/api/dispatches", dispatchRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Global error handler — must be last
app.use(errorHandler);

export default app;
