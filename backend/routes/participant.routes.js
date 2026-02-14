import express from "express";
import {handleSignupParticipant,handleLoginParticipant} from "../controllers/participant.controller.js";

const router = express.Router();

router.post("/signup", handleSignupParticipant);

router.post("/login", handleLoginParticipant);

export default router;
