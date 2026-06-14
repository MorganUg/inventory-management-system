import { Router } from 'express';
import { getAll, getOne, create, complete, updateStatus } from '../controllers/batches.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = Router();

router.use(authenticate);

router.get('/',              getAll);
router.get('/:id',           getOne);
router.post('/',             authorise('admin', 'manager'), create);
router.patch('/:id/status',  authorise('admin', 'manager'), updateStatus);
router.post('/:id/complete', authorise('admin', 'manager'), complete);

export default router;