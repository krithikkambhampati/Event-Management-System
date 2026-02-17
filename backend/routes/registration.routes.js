import express from "express";
import {
  handleRegisterParticipant,
  handleGetParticipantRegistrations,
  handleGetEventRegistrations,
  handleCancelRegistration
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
  requireParticipant,
  handleCancelRegistration
);

export default router;
