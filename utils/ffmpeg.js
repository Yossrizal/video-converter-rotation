// utils/ffmpeg.js
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";

// pakai ffmpeg binary bawaan package
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

// configure fontconfig so drawtext can find bundled fonts on Windows builds
const localFontDir = path.resolve("public/fonts");
const localFontFile = path.join(localFontDir, "Roboto-Regular.ttf");
if (fs.existsSync(localFontFile)) {
  const fontConfigPath = path.join(localFontDir, "fonts.conf");
  if (!fs.existsSync(fontConfigPath)) {
    try {
      const xml = `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <dir>${localFontDir.replace(/\\/g, "/")}</dir>\n</fontconfig>\n`;
      fs.writeFileSync(fontConfigPath, xml, "utf8");
    } catch (err) {
      console.warn("Unable to write fontconfig file", err);
    }
  }
  if (!process.env.FONTCONFIG_FILE) process.env.FONTCONFIG_FILE = fontConfigPath;
  if (!process.env.FONTCONFIG_PATH) process.env.FONTCONFIG_PATH = localFontDir;
}

// umumkan opsi output
const commonOpts = ["-c:v libx264", "-crf 18", "-preset medium", "-c:a copy", "-r 30"];

export function toVerticalBlur(input, output, title, description, w = 1080, h = 1920) {
  let filter = `
    [0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},
    boxblur=20:1[bg];
    [0:v]scale=${w}:-2:force_original_aspect_ratio=decrease[fg];
    [bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p
  `.replace(/\s+/g, " ").trim();

  const dt = buildDrawtext(title, description, w);
  if (dt) filter += `,${dt}`;
  return run(input, output, filter, title, description);
}

export function toVerticalPad(input, output, title, description, w = 1080, h = 1920) {
  let filter = `
    scale=${w}:-2:force_original_aspect_ratio=decrease,
    pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,format=yuv420p
  `.replace(/\s+/g, " ").trim();
  const dt = buildDrawtext(title, description, w);
  if (dt) filter += `,${dt}`;
  return runVF(input, output, filter, title, description);
}

export function toVerticalCrop(input, output, title, description, w = 1080, h = 1920) {
  let filter = `
    scale=${w}:${h}:force_original_aspect_ratio=increase,
    crop=${w}:${h},format=yuv420p
  `.replace(/\s+/g, " ").trim();
  const dt = buildDrawtext(title, description, w);
  if (dt) filter += `,${dt}`;
  return runVF(input, output, filter, title, description);
}

// helpers
function sanitizeMeta(v) {
  if (!v && v !== 0) return "";
  return String(v).replace(/[\r\n]+/g, ' ').trim();
}

function escapeDrawtext(v) {
  if (!v && v !== 0) return "";
  return String(v)
    .replace(/\\/g, "\\\\")     // escape backslashes
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")        // newlines to \n
    .replace(/:/g, "\\:")          // option separator
    .replace(/,/g, "\\,")          // filter separator
    .replace(/%/g, "\\%")          // avoid expansion sequences
    .replace(/'/g, "\\'");         // escape single quotes
}

function escapeFilterValue(v) {
  if (!v && v !== 0) return "";
  return String(v)
    .replace(/\\/g, "\\\\")
    // keep ':' as-is for most values inside quotes
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/'/g, "\\'");
}

function quotePathForFilter(p) {
  if (!p) return "''";
  const abs = path.resolve(String(p));
  const drive = abs.match(/^([a-zA-Z]):(.*)$/);
  let normalized;
  if (drive) {
    const rest = drive[2].replace(/\\/g, '/').replace(/^\/+/, '');
    normalized = `${drive[1]}\\:/${rest}`;
  } else {
    normalized = abs.replace(/\\/g, '/');
  }
  const escaped = normalized.replace(/'/g, "\\'");
  return `'${escaped}'`;
}

function findRobotoFont() {
  const candidates = [
    process.env.FONT_FILE,
    path.resolve('public/fonts/Roboto-Regular.ttf'),
    path.resolve('public/Roboto-Regular.ttf'),
    path.resolve('fonts/Roboto-Regular.ttf'),
    // Common OS paths
    'C:/Windows/Fonts/Roboto-Regular.ttf',
    '/usr/share/fonts/truetype/roboto/Roboto-Regular.ttf',
    '/Library/Fonts/Roboto-Regular.ttf'
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

function buildDrawtext(title, description, widthPx = 1080) {
  const t = title ? String(title).trim() : '';
  const d = description ? String(description).trim() : '';
  const parts = [];
  const fontfile = findRobotoFont();
  const common = [];
  if (fontfile) common.push(`fontfile=${quotePathForFilter(fontfile)}`);
  // Use a black box background to emulate strong outline; widely supported
  common.push('fontcolor=white', 'box=1', 'boxcolor=black@0.6', 'boxborderw=24');
  const commonOpts = common.join(':');

  if (t) {
    const txt = escapeDrawtext(t);
    parts.push(`drawtext=${commonOpts}:text='${txt}':x=(w-text_w)/2:y=80:fontsize=144`);
  }
  if (d) {
    const approxCharsPerLine = Math.max(10, Math.floor(widthPx / (108 * 0.6)) - 2);
    const wrapped = wrapText(d, approxCharsPerLine);
    const txt = escapeDrawtext(wrapped);
    const lineSpacing = Math.round(108 * 0.35);
    parts.push(`drawtext=${commonOpts}:line_spacing=${lineSpacing}:text='${txt}':x=(w-text_w)/2:y=h-text_h-80:fontsize=108`);
  }

  return parts.join(',');
}

export function __debugBuildDrawtext(title, description, widthPx) {
  return buildDrawtext(title, description, widthPx);
}

function run(input, output, filter_complex, title, description) {
  return new Promise((res, rej) => {
    ffmpeg(input)
      .on("error", rej)
      .outputOptions(commonOpts)
      .outputOptions('-metadata', `title=${sanitizeMeta(title)}`)
      .outputOptions('-metadata', `comment=${sanitizeMeta(description)}`)
      .complexFilter(filter_complex)
      .on("end", res)
      .on("error", rej)
      .save(output);
  });
}
function runVF(input, output, vf, title, description) {
  return new Promise((res, rej) => {
    ffmpeg(input)
      .on("error", rej)
      .videoFilters(vf)
      .outputOptions(commonOpts)
      .outputOptions('-metadata', `title=${sanitizeMeta(title)}`)
      .outputOptions('-metadata', `comment=${sanitizeMeta(description)}`)
      .on("end", res)
      .on("error", rej)
      .save(output);
  });
}
