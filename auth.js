import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
  process.exit(1);
}

export async function hashPassword(plainPassword, saltRounds = 10) {
  try {
    if (!plainPassword) throw new Error("Password is required");
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (err) {
    console.error("Error hashing password:", err);
    return null;
  }
}

export async function checkPassword(plainPassword, hashedPassword) {
  try {
    if (!plainPassword || !hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    console.error("Error checking password:", err);
    return false;
  }
}

export function generateJWT(payload, opts = { expiresIn: "24h" }) {
  try {
    if (typeof payload !== "object" || payload === null) {
      throw new Error("Payload must be an object.");
    }
    return jwt.sign(payload, JWT_SECRET, opts);
  } catch (err) {
    console.error("Error generating token:", err);
    return null;
  }
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided or malformed." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token. Please log in again." });
    }
    return res
      .status(403)
      .json({ message: "Forbidden. Token verification failed." });
  }
}
