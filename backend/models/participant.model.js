import mongoose from "mongoose";

const participantSchema=new mongoose.Schema({
    fName:{
        type:String,
        required:true,
    },
    lName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    collegeName: {
        type: String,
        required: true
    },
    participantType: {
        type: String,
        enum: ["IIIT", "NON_IIIT"],
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },

    password:{
        type:String,
        required:true,
    },
    interests: [{
        type: String
    }],
    followedOrganizers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organizer"
    }],

    
},{timestamps:true});



export const Participant=mongoose.model('Participant',participantSchema);