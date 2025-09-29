// utils/ffmpeg.js
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

// pakai ffmpeg binary bawaan package
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

// umumkan opsi output
const commonOpts = ["-c:v libx264", "-crf 18", "-preset medium", "-c:a copy", "-r 30"];

export function toVerticalBlur(input, output, w = 1080, h = 1920) {
  const filter = `
    [0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},
    boxblur=20:1[bg];
    [0:v]scale=${w}:-2:force_original_aspect_ratio=decrease[fg];
    [bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p
  `.replace(/\s+/g, " ");
  return run(input, output, filter);
}

export function toVerticalPad(input, output, w = 1080, h = 1920) {
  const filter = `
    scale=${w}:-2:force_original_aspect_ratio=decrease,
    pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,format=yuv420p
  `.replace(/\s+/g, " ");
  return runVF(input, output, filter);
}

export function toVerticalCrop(input, output, w = 1080, h = 1920) {
  const filter = `
    scale=${w}:${h}:force_original_aspect_ratio=increase,
    crop=${w}:${h},format=yuv420p
  `.replace(/\s+/g, " ");
  return runVF(input, output, filter);
}

// helpers
function run(input, output, filter_complex) {
  return new Promise((res, rej) => {
    ffmpeg(input)
      .on("error", rej)
      .outputOptions(commonOpts)
      .complexFilter(filter_complex)
      .on("end", res)
      .on("error", rej)
      .save(output);
  });
}
function runVF(input, output, vf) {
  return new Promise((res, rej) => {
    ffmpeg(input)
      .on("error", rej)
      .videoFilters(vf)
      .outputOptions(commonOpts)
      .on("end", res)
      .on("error", rej)
      .save(output);
  });
}
