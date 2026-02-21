import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import participantRouter from "./routes/participant.routes.js";
import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/auth.routes.js";
import eventRouter from "./routes/event.routes.js";
import registrationRouter from "./routes/registration.routes.js";
import organizerRouter from "./routes/organizer.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import discussionRouter from "./routes/discussion.routes.js";
import path from "path";
import { fileURLToPath } from "url";



dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
const PORT = 8000

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/participants", participantRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/registrations", registrationRouter);
app.use("/api/organizers", organizerRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/discussions", discussionRouter);
await mongoose.connect("mongodb://127.0.0.1:27017/eventManagementSystem")
  .then(() => console.log("MONGODB connected"))
  .catch(() => console.log("Error occured while connecting to MONGODB"))




app.listen(PORT, () => console.log("Server running on port:", PORT));