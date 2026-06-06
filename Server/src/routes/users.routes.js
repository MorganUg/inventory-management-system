import { Router } from "express";
import {
  getAll,
  getOne,
  update,
  remove,
  resetPassword,
  deactivate,
  create,
} from "../controllers/users.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorise } from "../middleware/roles.js";

const router = Router();

router.use(authenticate); // all routes require login

router.get("/", authorise("admin", "manager"), getAll);
router.get("/:id", authorise("admin", "manager"), getOne);
router.post("/", authorise("admin"), create);
// Note: Actual authorization logic (role changes, manager restrictions) lives in the controller
router.put("/:id", authorise("admin"), update);
router.delete("/:id", authorise("admin"), remove);
router.post("/:id/reset-password", authorise("admin"), resetPassword);
router.post("/:id/deactivate", authorise("admin"), deactivate);

export default router;
