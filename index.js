import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase } from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import galleryRoutes from "./routes/galleryRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

let db, usersCol;
try {
  db = await connectToDatabase();
  usersCol = db.collection("users");

  app.locals.db = db;

  await usersCol.createIndex({ username: 1 }, { unique: true });
  await usersCol.createIndex({ email: 1 }, { unique: true });

  app.locals.users = usersCol;
  console.log("MongoDB connected & indexes ensured (username, email)");
} catch (err) {
  console.error("DB connection error:", err.message);
  process.exit(1);
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/gallery", galleryRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Pozdrav ${req.user.username}, imate pristup!` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
