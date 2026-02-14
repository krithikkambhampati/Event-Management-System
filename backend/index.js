import express from "express";
import mongoose from "mongoose";




const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
PORT=8000


await mongoose.connect("mongodb://127.0.0.1:27017/eventManagementSystem")
.then(()=>console.log("MONGODB connected"))
.catch(()=>console.log("Error occured while connecting to MONGODB"))




app.listen(PORT,()=>console.log("Server running on port:",PORT));