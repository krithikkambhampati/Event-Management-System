import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const organizerSchema = new mongoose.Schema(
  {
    organizerName: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true
    },

    contactNumber: {
      type: String,
      required: true
    },

    

    password: {
      type: String,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    passwordResetStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED"],
      default: "NONE"
    },

    passwordResetRequestedAt: {
      type: Date,
      default: null
    },

    discordWebhook: {
      type: String,
      default: null,
      trim: true
    }

  },
  { timestamps: true }
);

organizerSchema.pre("save", async function () {
  
  if (!this.isModified("password")) return ;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
});

organizerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Organizer = mongoose.model("Organizer", organizerSchema);
