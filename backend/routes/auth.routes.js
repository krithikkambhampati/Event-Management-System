import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { handleGetMe, handleLogin, handleLogout } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/me", verifyToken, handleGetMe);
router.post("/logout", handleLogout);
router.post("/login", handleLogin);
export default router;
