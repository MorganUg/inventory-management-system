import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Security middleware
import morgan from 'morgan'; // Logging middleware

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import supplierRoutes from './routes/suppliers.routes.js';
import customerRoutes from './routes/customers.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import rawMaterialRoutes from './routes/rawMaterials.routes.js';
import restockRoutes from './routes/restocks.routes.js';
import bomRoutes from './routes/bom.routes.js';
import batchRoutes from './routes/batches.routes.js';
import finishedGoodRoutes from './routes/finishedGoods.routes.js';
import dispatchRoutes from './routes/dispatches.routes.js';
import stockMovementRoutes from './routes/stockMovements.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' })); // React dev server
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/suppliers',      supplierRoutes);
app.use('/api/customers',      customerRoutes);
app.use('/api/categories',     categoryRoutes);
app.use('/api/raw-materials',  rawMaterialRoutes);
app.use('/api/restocks',       restockRoutes);
app.use('/api/bom',            bomRoutes);
app.use('/api/batches',        batchRoutes);
app.use('/api/finished-goods', finishedGoodRoutes);
app.use('/api/dispatches',     dispatchRoutes);
app.use('/api/stock-movements',stockMovementRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler — must be last
app.use(errorHandler);

export default app;