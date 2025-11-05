import { verifyJWT } from "../services/authService.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Pristup odbijen. Token nije poslan ili je neispravan.",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token je istekao. Prijavi se ponovno." });
    }
    return res.status(401).json({ message: "Neispravan token." });
  }
}

export function isAdmin(req, res, next) {
  if (!req.user)
    return res
      .status(401)
      .json({ message: "Nemaš token ili nisi prijavljen." });

  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "Pristup dozvoljen samo administratorima." });

  next();
}

export function isUser(req, res, next) {
  if (!req.user)
    return res
      .status(401)
      .json({ message: "Nemaš token ili nisi prijavljen." });

  if (req.user.role !== "user" && req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "Pristup dozvoljen samo korisnicima." });

  next();
}
