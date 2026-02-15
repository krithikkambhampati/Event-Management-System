import { Participant } from "../models/participant.model.js";
import { Admin } from "../models/admin.model.js";
import { generateToken } from "../utils/generateToken.js";

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

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleGetMe = async (req, res) => {
  try {
    let user;

    if (req.user.role === "PARTICIPANT") {
      user = await Participant.findById(req.user.id).select("-password");
    }

    if (req.user.role === "ADMIN") {
      user = await Admin.findById(req.user.id).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        ...user._doc,
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
