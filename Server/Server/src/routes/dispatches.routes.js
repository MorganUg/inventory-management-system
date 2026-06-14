import { Router } from 'express';
import { getAll, create } from '../controllers/dispatches.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.post('/', authorise('admin', 'manager'), create);

export default router;
