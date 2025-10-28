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
  if (!plainPassword) throw new Error("Password is required");
  return bcrypt.hash(plainPassword, saltRounds);
}

export async function checkPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateJWT(payload, opts = { expiresIn: "24h" }) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Payload must be an object");
  }
  return jwt.sign(payload, JWT_SECRET, opts);
}

export function verifyJWT(token) {
  return jwt.verify(token, JWT_SECRET);
}
