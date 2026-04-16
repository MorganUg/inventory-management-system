import {router} from 'express';
import {
  getAll, getOne, create, update, remove
} from '../controllers/suppliers.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = router();

router.use(authenticate); //all routes require authentication

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', authorise('admin', 'manager'), create);
router.put('/:id', authorise('admin', 'manager'), update);
router.delete('/:id', authorise('admin'), remove);

export default router;