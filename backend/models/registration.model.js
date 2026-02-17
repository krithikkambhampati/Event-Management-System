import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    ticketId: {
      type: String,
      unique: true,
      required: true
    },

    registrationData: {
      type: {},
      default: {}
    },

    participationStatus: {
      type: String,
      enum: ["Registered", "Completed", "Cancelled"],
      default: "Registered"
    },

    attendanceMarked: {
      type: Boolean,
      default: false
    },

    attendedAt: {
      type: Date,
      default: null
    },

    registeredAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

registrationSchema.index({ participant: 1, event: 1 }, { unique: true });

export const Registration = mongoose.model("Registration", registrationSchema);
