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

const allowedOrigins = [
  "http://localhost:5173", // Local dev (Vite)
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// React dev server
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for APIs (or configure properly)
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use("/api", apiLimiter); // Apply to all API routes

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

app.get("/", (req, res) => {
  res.json({
    message: "AI Inventory Management System API is Running!",
    status: "OK",
    environment: process.env.NODE_ENV,
    time: new Date().toISOString(),
    docs: "/api/health",
  });
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Global error handler — must be last
app.use(errorHandler);

export default app;
