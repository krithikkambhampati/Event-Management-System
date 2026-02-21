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
      enum: ["Registered", "Pending", "Completed", "Cancelled"],
      default: "Registered"
    },

    paymentProof: {
      type: String,
      default: null
    },

    paymentStatus: {
      type: String,
      enum: ["Not Required", "Pending", "Approved", "Rejected"],
      default: "Not Required"
    },

    rejectionReason: {
      type: String,
      default: null
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
