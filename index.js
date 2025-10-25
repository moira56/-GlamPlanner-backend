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
import { body, validationResult } from "express-validator";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = await connectToDatabase();
const users = db.collection("users");

const PORT = process.env.PORT || 3000;

app.post(
  "/api/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 chars long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const existingUser = await users.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await hashPassword(password);
    await users.insertOne({ username, password: hashed });

    const token = generateJWT({ username });
    res.json({ message: "User registered successfully", token });
  }
);

app.post(
  "/api/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = await users.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await checkPassword(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateJWT({ username });
    res.json({ token });
  }
);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Pozdrav ${req.user.username}, imate pristup!` });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
