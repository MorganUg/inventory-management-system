import { Router } from 'express';
import { getAll, getOne, create } from '../controllers/restocks.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = Router();

router.use(authenticate); // all routes require login

router.get('/',     getAll);
router.get('/:id',  getOne);
router.post('/',    authorise('admin', 'manager', 'staff'), create);

export default router;