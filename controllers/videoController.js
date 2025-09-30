// controllers/videoController.js
import fs from "fs";
import path from "path";
import { toVerticalBlur, toVerticalPad, toVerticalCrop } from "../utils/ffmpeg.js";

async function processVideo(mode, inputPath, title, description) {
  const outName = `${Date.now()}-vertical.mp4`;
  const outputPath = path.join("outputs", outName);

  if (mode === "pad") {
    await toVerticalPad(inputPath, outputPath, title, description);
  } else if (mode === "crop") {
    await toVerticalCrop(inputPath, outputPath, title, description);
  } else {
    await toVerticalBlur(inputPath, outputPath, title, description);
  }

  return outputPath;
}

export async function handleUpload(req, res) {
  if (!req.file) return res.status(400).send("No file uploaded");

  const inputPath = req.file.path;
  const mode = (req.query.mode || "blur").toLowerCase();
  const { title, description } = req.body;

  try {
    const outputPath = await processVideo(mode, inputPath, title, description);
    res.json({
      outputPath: outputPath.replace(/\\/g, "/"),
      inputPath: inputPath.replace(/\\/g, "/"),
    });
  } catch (e) {
    console.error(e);
    safeUnlink(inputPath);
    res.status(500).send("Processing failed");
  }
}

export async function handleReprocess(req, res) {
  const { inputPath, mode, title, description } = req.body;

  if (!inputPath) return res.status(400).send("Missing inputPath");

  try {
    const outputPath = await processVideo(mode, inputPath, title, description);
    res.json({
      outputPath: outputPath.replace(/\\/g, "/"),
      inputPath: inputPath.replace(/\\/g, "/"),
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Reprocessing failed");
  }
}

export function handleCleanup(req, res) {
  const { inputPath } = req.body;
  safeUnlink(inputPath);
  res.send("Cleanup successful");
}

function safeUnlink(p) {
  if (!p) return;
  fs.stat(p, (err) => {
    if (!err) fs.unlink(p, () => {});
  });
}
