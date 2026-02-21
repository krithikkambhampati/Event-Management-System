import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const participantSchema = new mongoose.Schema({
    fName: {
        type: String,
        required: true,
    },
    lName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
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

    password: {
        type: String,
        required: true,
    },
    interests: [{
        type: String
    }],
    followedOrganizers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organizer"
    }],
    hasCompletedOnboarding: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });


participantSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

participantSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const Participant = mongoose.model('Participant', participantSchema);