import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase } from "./db.js";
import {
  authMiddleware,
  generateJWT,
  checkPassword,
  hashPassword,
} from "./auth.js";

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
  console.log("MongoDB connected & users index ensured");
} catch (err) {
  console.error("DB connection error:", err.message);
  process.exit(1);
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username i password su obavezni" });
    }

    const exists = await usersCol.findOne({ username });
    if (exists) {
      return res.status(409).json({ message: "Korisnik već postoji" });
    }

    const passwordHash = await hashPassword(password);
    if (!passwordHash) {
      return res.status(500).json({ message: "Greška pri hashiranju lozinke" });
    }

    const { insertedId } = await usersCol.insertOne({
      username,
      password: passwordHash,
      createdAt: new Date(),
    });

    const token = generateJWT({ id: insertedId, username });
    return res.status(201).json({ id: insertedId, username, token });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Korisnik već postoji" });
    }
    console.error(err);
    return res.status(500).json({ message: "Interna greška poslužitelja" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username i password su obavezni" });
    }

    const user = await usersCol.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await checkPassword(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateJWT({ id: user._id, username: user.username });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Interna greška poslužitelja" });
  }
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Pozdrav ${req.user.username}, imate pristup!` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
