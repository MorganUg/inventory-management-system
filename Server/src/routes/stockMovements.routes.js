import { Router } from 'express';
import { getAll, getOne, getSummary } from '../controllers/stockMovements.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = Router();

router.use(authenticate); // all routes require login

router.get('/',     getAll);
router.get('/:id',  getOne);
router.get('/summary', authorise('admin'), getSummary);

export default router;