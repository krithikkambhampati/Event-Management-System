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

export const requireParticipant = (req, res, next) => {
  if (!req.user || req.user.role !== "PARTICIPANT") {
    return res.status(403).json({ message: "Forbidden: Only participants can access this" });
  }
  next();
};

export const requireOrganizer = (req, res, next) => {
  if (!req.user || req.user.role !== "ORGANIZER") {
    return res.status(403).json({ message: "Forbidden: Only organizers can access this" });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden: Only admins can access this" });
  }
  next();
};
