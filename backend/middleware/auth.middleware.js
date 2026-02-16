import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Organizer } from "../models/organizer.model.js";

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || !decoded?.role) {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax"
      });
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax"
      });
      return res.status(401).json({ message: "Invalid token" });
    }

    if (decoded.role === "ORGANIZER") {
      const organizer = await Organizer.findById(decoded.id).select("isActive").lean();

      if (!organizer || !organizer.isActive) {
        res.clearCookie("token", {
          httpOnly: true,
          sameSite: "lax"
        });
        return res.status(401).json({ message: "Organizer account disabled" });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax"
    });
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
