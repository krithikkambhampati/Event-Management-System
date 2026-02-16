import { Participant } from "../models/participant.model.js";
import { Admin } from "../models/admin.model.js";
import { generateToken } from "../utils/generateToken.js";
import { Organizer } from "../models/organizer.model.js";
import mongoose from "mongoose";

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user;
    let role;

    const admin = await Admin.findOne({ email });
    if (admin) {
      const isMatch = (admin.password===password)
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      user = admin;
      role = "ADMIN";
    }
    if (!user) {
      const organizer = await Organizer.findOne({email });

      if (organizer) {
        if (!organizer.isActive) {
          return res.status(403).json({ message: "Account disabled" });
        }

        const isMatch = await organizer.comparePassword(password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

        user = organizer;
        role = "ORGANIZER";
      }
    }

    if (!user) {
      const participant = await Participant.findOne({ email });

      if (!participant) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await participant.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      user = participant;
      role = "PARTICIPANT";
    }

    const token = generateToken(user._id, role);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    // Build user response based on role
    const userResponse = {
      _id: user._id,
      email: user.email,
      role
    };

    // Add role-specific fields
    if (role === "PARTICIPANT") {
      userResponse.fName = user.fName;
      userResponse.lName = user.lName;
    } else if (role === "ORGANIZER") {
      userResponse.organizerName = user.organizerName;
    } else if (role === "ADMIN") {
      userResponse.name = user.name;
    }

    res.status(200).json({
      message: "Login successful",
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleGetMe = async (req, res) => {
  try {
    if (!req.user?.id || !req.user?.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roleToModel = {
      PARTICIPANT: Participant,
      ADMIN: Admin,
      ORGANIZER: Organizer
    };

    const Model = roleToModel[req.user.role];

    if (!Model) {
      return res.status(401).json({ message: "Invalid role in token" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax"
      });
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await Model.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        ...user.toObject(),
        role: req.user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleLogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax"
  });

  res.status(200).json({ message: "Logged out successfully" });
};
