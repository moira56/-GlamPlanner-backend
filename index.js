import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase } from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://glamplanner.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "CORS pravila za ovu stranicu ne dopuštaju pristup s navedene adrese.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use(express.json());

const PORT = process.env.PORT || 3000;

let db, usersCol, plansCol, eventsCol;
try {
  db = await connectToDatabase();
  usersCol = db.collection("users");
  plansCol = db.collection("plans");
  eventsCol = db.collection("events");

  app.locals.db = db;
  app.locals.users = usersCol;
  app.locals.plans = plansCol;
  app.locals.events = eventsCol;

  await usersCol.createIndex({ username: 1 }, { unique: true });
  await usersCol.createIndex({ email: 1 }, { unique: true });

  await plansCol.createIndex({ adminId: 1, createdAt: -1 });
  await plansCol.createIndex({ userId: 1, createdAt: -1 });

  await eventsCol.createIndex({ createdAt: -1 });

  console.log("MongoDB connected & indexes ensured");
} catch (err) {
  console.error("DB connection error:", err.message);
  process.exit(1);
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/events", eventRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Pozdrav ${req.user.username}, imate pristup!` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
