import { Router } from "express";
import {
  getAll,
  getOne,
  getSummary,
} from "../controllers/stockMovements.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorise } from "../middleware/roles.js";

const router = Router();

router.use(authenticate); // all routes require login
router.use(authorise("admin", "manager")); // all routes require admin or manager role, staff cannot access audit trails

router.get("/", getAll);
router.get("/:id", getOne);
router.get("/summary", authorise("admin"), getSummary);

export default router;
