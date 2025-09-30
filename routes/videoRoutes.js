// routes/videoRoutes.js
import { Router } from "express";
import multer from "multer";
import { handleUpload, handleReprocess, handleCleanup } from "../controllers/videoController.js";
import express from "express";

const router = Router();

// Multer config
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4") cb(null, true);
    else cb(new Error("Only MP4 allowed"));
  }
});

router.post("/upload", upload.single("video"), handleUpload);
router.post("/reprocess", express.json(), handleReprocess);
router.post("/cleanup", express.json(), handleCleanup);


export default router;
