import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import participantRouter from "./routes/participant.routes.js";
import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/auth.routes.js";



dotenv.config();
const app=express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
const PORT=8000

app.use("/api/participants", participantRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
await mongoose.connect("mongodb://127.0.0.1:27017/eventManagementSystem")
.then(()=>console.log("MONGODB connected"))
.catch(()=>console.log("Error occured while connecting to MONGODB"))




app.listen(PORT,()=>console.log("Server running on port:",PORT));