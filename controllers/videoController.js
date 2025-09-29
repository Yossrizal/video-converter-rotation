// controllers/videoController.js
import fs from "fs";
import path from "path";
import { toVerticalBlur, toVerticalPad, toVerticalCrop } from "../utils/ffmpeg.js";

export async function handleUpload(req, res) {
  if (!req.file) return res.status(400).send("No file uploaded");
  const inputPath = req.file.path;

  // pilih mode via query ?mode=blur|pad|crop (default: blur)
  const mode = (req.query.mode || "blur").toLowerCase();
  const outName = `${Date.now()}-vertical.mp4`;
  const outputPath = path.join("outputs", outName);

  try {
    if (mode === "pad")      await toVerticalPad(inputPath, outputPath);
    else if (mode === "crop")await toVerticalCrop(inputPath, outputPath);
    else                     await toVerticalBlur(inputPath, outputPath);

    // kirim hasil sebagai unduhan lalu bersihkan file
    res.download(outputPath, outName, err => {
      safeUnlink(inputPath);
      safeUnlink(outputPath);
      if (err) console.error(err);
    });
  } catch (e) {
    console.error(e);
    safeUnlink(inputPath);
    safeUnlink(outputPath);
    res.status(500).send("Processing failed");
  }
}

function safeUnlink(p) {
  if (!p) return;
  fs.stat(p, (err) => {
    if (!err) fs.unlink(p, () => {});
  });
}
