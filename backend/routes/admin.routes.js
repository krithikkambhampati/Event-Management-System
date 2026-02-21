import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createOrganizer,
  listOrganizers,
  updateOrganizerStatus,
  deleteOrganizer,
  resetOrganizerPassword,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest
} from "../controllers/admin.controller.js";
const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};


router.post(
  "/create-organizer",
  verifyToken,
  requireAdmin,
  createOrganizer
);

router.get(
  "/organizers",
  verifyToken,
  requireAdmin,
  listOrganizers
);

router.patch(
  "/organizers/:id/status",
  verifyToken,
  requireAdmin,
  updateOrganizerStatus
);

router.delete(
  "/organizers/:id",
  verifyToken,
  requireAdmin,
  deleteOrganizer
);

router.post(
  "/organizers/:id/reset-password",
  verifyToken,
  requireAdmin,
  resetOrganizerPassword
);

router.get(
  "/password-resets",
  verifyToken,
  requireAdmin,
  getPasswordResetRequests
);

router.post(
  "/password-resets/:id/approve",
  verifyToken,
  requireAdmin,
  approvePasswordResetRequest
);

router.post(
  "/password-resets/:id/reject",
  verifyToken,
  requireAdmin,
  rejectPasswordResetRequest
);

export default router;
