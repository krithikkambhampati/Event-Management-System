import express from "express";
import {handleSignupParticipant} from "../controllers/participant.controller.js";
import { handleGetMe } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", handleSignupParticipant);



export default router;
