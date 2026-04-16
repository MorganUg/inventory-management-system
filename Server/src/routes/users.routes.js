import { Router } from 'express';
import { getAll, getOne, update, remove, resetPassword, deactivate } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = Router();

router.use(authenticate); // all routes require login

router.get('/',authorise('admin'), getAll);
router.get('/:id',  authorise('admin'), getOne);
router.put('/:id',  authorise('admin', 'manager'), update);
router.delete('/:id', authorise('admin'),          remove);
router.post('/:id/reset-password', authorise('admin'), resetPassword);
router.post('/:id/deactivate', authorise('admin'), deactivate);

export default router;