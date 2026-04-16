import { Router } from 'express';
import {
    getAll, getOne, create, update, remove
} from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = Router();

router.use(authenticate); // all routes require login

router.get('/',     getAll);
router.get('/:id',  getOne);
router.post('/',    authorise('admin', 'manager'), create);
router.put('/:id',  authorise('admin', 'manager'), update);
router.delete('/:id', authorise('admin'),          remove);

export default router;