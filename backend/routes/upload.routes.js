import express from "express";
import upload from "../middleware/upload.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/upload — single file upload (authenticated)
router.post("/", verifyToken, upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        res.status(200).json({
            message: "File uploaded successfully",
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                url: fileUrl
            }
        });
    } catch (error) {
        console.error("Upload error:", error.message);
        res.status(500).json({ message: "File upload failed" });
    }
});

// Error handler for multer
router.use((err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
    }
    if (err.message) {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

export default router;
