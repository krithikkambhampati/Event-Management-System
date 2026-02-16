import { Organizer } from "../models/organizer.model.js";
import crypto from "crypto";

const buildBaseLoginHandle = (organizerName) => {
  const normalized = String(organizerName || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  return normalized || "organizer";
};

const generateUniqueOrganizerEmail = async (organizerName) => {
  const baseHandle = buildBaseLoginHandle(organizerName);
  let counter = 0;

  while (true) {
    const email = `${baseHandle}${counter === 0 ? "" : counter}@ems.org`;
    const existing = await Organizer.findOne({ email }).select("_id");

    if (!existing) return email;
    counter += 1;
  }
};

export const createOrganizer = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber
    } = req.body || {}; 

    if (
      !organizerName ||
      !category ||
      !description ||
      !contactEmail ||
      !contactNumber
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const generatedPassword = crypto.randomBytes(6).toString("hex");

    let email = await generateUniqueOrganizerEmail(organizerName);
    let organizer;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        organizer = await Organizer.create({
          organizerName,
          category,
          description,
          contactEmail,
          contactNumber,
          email,
          isActive: true,
          password: generatedPassword
        });
        break;
      } catch (createError) {
        const isDuplicateKey = createError?.code === 11000;
        const duplicateField = Object.keys(createError?.keyPattern || {})[0] || "";

        if (!isDuplicateKey) throw createError;

        if (duplicateField === "email") {
          email = await generateUniqueOrganizerEmail(organizerName);
          continue;
        }

        return res.status(409).json({
          message: `${duplicateField} already exists. Please use a different value.`
        });
      }
    }

    if (!organizer) {
      return res.status(500).json({ message: "Could not create organizer. Please retry." });
    }

    res.status(201).json({
      message: "Organizer created successfully",
      credentials: {
        email,
        password: generatedPassword
      }
    });

  } catch (error) {
    console.error("createOrganizer error:", error);

    res.status(500).json({ message: "Internal server error" });
  }
};
