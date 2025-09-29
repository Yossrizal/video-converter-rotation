// server.js
import express from "express";
import path from "path";
import fs from "fs";
import videoRoutes from "./routes/videoRoutes.js";

const app = express();

// pastikan folder ada
for (const dir of ["public", "uploads", "outputs"]) {
  fs.mkdirSync(dir, { recursive: true });
}

// static files
app.use(express.static(path.resolve("public")));

// api routes
app.use("/", videoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
