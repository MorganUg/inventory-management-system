import { Router } from 'express';
import {
  getAll, getOne, getByFinishedGood,
  create, addItem, updateItem, deleteItem, setActiveVersion
} from '../controllers/bom.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorise } from '../middleware/roles.js';

const router = Router();

router.use(authenticate); // all routes require login

//BOM headers
router.get('/', getAll);
router.get('/:id', getOne);
router.get('/finished-goods/:id', getByFinishedGood);
router.post('/', authorise('admin', 'manager'), create);
router.patch('/:id/activate', authorise('admin', "manager"), setActiveVersion);

// BOM items (ingredients) 
router.post('/:id/items', authorise('admin', 'manager'), addItem);
router.put('/:id/items/:itemId', authorise('admin','manager'), updateItem);
router.delete('/:id/items/:itemId', authorise('admin', 'manager'), deleteItem);

export default router;