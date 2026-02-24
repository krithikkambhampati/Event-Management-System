import express from "express";
import {
  handleRegisterParticipant,
  handleGetParticipantRegistrations,
  handleGetEventRegistrations,
  handleCancelRegistration,
  handleApprovePayment,
  handleRejectPayment,
  handleScanQR,
  handleManualAttendance
} from "../controllers/registration.controller.js";
import { verifyToken, requireParticipant, requireOrganizer } from "../middleware/auth.middleware.js";

const router = express.Router();

// Important: Specific routes must come before generic /:id routes
router.get(
  "/participant/my-registrations",
  verifyToken,
  requireParticipant,
  handleGetParticipantRegistrations
);

router.post(
  "/:eventId/register",
  verifyToken,
  requireParticipant,
  handleRegisterParticipant
);

router.get(
  "/:eventId/registrations",
  verifyToken,
  requireOrganizer,
  handleGetEventRegistrations
);

router.post(
  "/:registrationId/cancel",
  verifyToken,
  requireOrganizer,
  handleCancelRegistration
);

// Payment approval routes (organizer only)
router.post(
  "/:registrationId/approve-payment",
  verifyToken,
  requireOrganizer,
  handleApprovePayment
);

router.post(
  "/:registrationId/reject-payment",
  verifyToken,
  requireOrganizer,
  handleRejectPayment
);

// Attendance tracking (organizer only)
router.post(
  "/:eventId/scan",
  verifyToken,
  requireOrganizer,
  handleScanQR
);

router.post(
  "/:registrationId/manual-attendance",
  verifyToken,
  requireOrganizer,
  handleManualAttendance
);

export default router;
