import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { createOrganizer } from "../controllers/admin.controller.js";
const router = express.Router();



router.post(
  "/create-organizer",
  verifyToken,
  (req, res, next) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  },
  createOrganizer
);

export default router;
