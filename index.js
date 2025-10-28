import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase } from "./db.js";

import authRoutes from "./rute/authRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

let db, usersCol;
try {
  db = await connectToDatabase();
  usersCol = db.collection("users");
  await usersCol.createIndex({ username: 1 }, { unique: true });
  app.locals.users = usersCol;
  console.log("MongoDB connected & users index ensured");
} catch (err) {
  console.error("DB connection error:", err.message);
  process.exit(1);
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", authRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Pozdrav ${req.user.username}, imate pristup!` });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
