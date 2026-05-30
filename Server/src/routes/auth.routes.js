import { Router } from "express";
import {
  register,
  login,
  getMe,
  updatePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorise } from "../middleware/roles.js";

const router = Router();

router.post("/register", authenticate, authorise("admin"), register); // Only admin can register new users
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.put("/update-password", authenticate, updatePassword);

export default router;
