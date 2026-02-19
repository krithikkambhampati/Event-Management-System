import express from "express";
import {handleSignupParticipant, handleUpdateParticipant, handleChangePassword} from "../controllers/participant.controller.js";
import { handleGetMe } from "../controllers/auth.controller.js";
import { verifyToken, requireParticipant } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", handleSignupParticipant);
router.put("/:id", verifyToken, requireParticipant, handleUpdateParticipant);
router.put("/:id/change-password", verifyToken, requireParticipant, handleChangePassword);

export default router;
