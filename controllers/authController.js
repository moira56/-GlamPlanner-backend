import { ObjectId } from "mongodb";
import {
  hashPassword,
  checkPassword,
  generateJWT,
} from "../services/authService.js";

function toObjectId(raw) {
  try {
    if (!raw) return null;
    if (raw instanceof ObjectId) return raw;

    if (typeof raw === "string") {
      return new ObjectId(raw);
    }

    if (typeof raw === "object") {
      if (raw.$oid) return new ObjectId(raw.$oid);
      if (raw.id) return new ObjectId(raw.id.toString());
      if (raw._id) return new ObjectId(raw._id.toString());
    }

    return new ObjectId(raw.toString());
  } catch {
    return null;
  }
}

export const AuthController = {
  async register(req, res) {
    try {
      const users = req.app.locals?.users;
      if (!users)
        return res.status(500).json({ message: "DB kolekcija nije dostupna" });

      const { email, username, password, role } = req.body;

      const existing = await users.findOne({
        $or: [{ email }, { username }],
      });

      if (existing) {
        if (existing.email === email)
          return res.status(400).json({ message: "Email je već u uporabi" });
        if (existing.username === username)
          return res.status(400).json({ message: "Korisničko ime je zauzeto" });
        return res.status(400).json({ message: "Korisnik već postoji" });
      }

      const passwordHash = await hashPassword(password);
      const now = new Date();
      const userRole =
        role && role.toLowerCase() === "admin" ? "admin" : "user";

      const insert = await users.insertOne({
        email,
        username,
        password: passwordHash,
        role: userRole,
        createdAt: now,
        updatedAt: now,
        firstName: "",
        lastName: "",
        avatarUrl: "",
      });

      const payload = {
        id: insert.insertedId.toString(),
        email,
        username,
        role: userRole,
      };
      const token = generateJWT(payload);

      return res.status(201).json({
        message: "Korisnik uspješno registriran",
        token,
        user: {
          id: insert.insertedId.toString(),
          email,
          username,
          role: userRole,
        },
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Greška na poslužitelju" });
    }
  },

  async login(req, res) {
    try {
      const users = req.app.locals?.users;
      if (!users)
        return res.status(500).json({ message: "DB kolekcija nije dostupna" });

      const { email, username, password } = req.body;
      const query = email ? { email } : { username };

      const user = await users.findOne(query);
      if (!user) return res.status(401).json({ message: "Neispravni podaci" });

      const ok = await checkPassword(password, user.password);
      if (!ok) return res.status(401).json({ message: "Neispravni podaci" });

      const token = generateJWT({
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role || "user",
      });

      return res.json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role || "user",
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Greška na poslužitelju" });
    }
  },

  async getMe(req, res) {
    try {
      const users = req.app.locals?.users;
      if (!users)
        return res.status(500).json({ message: "DB kolekcija nije dostupna" });

      const userId = toObjectId(req.user.id);

      const query = userId ? { _id: userId } : { email: req.user.email };

      const user = await users.findOne(query, {
        projection: { password: 0 },
      });

      if (!user)
        return res.status(404).json({ message: "Korisnik nije pronađen" });

      res.json({
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role || "user",
      });
    } catch (err) {
      console.error("Greška u getMe:", err);
      res.status(500).json({ message: "Greška pri dohvaćanju korisnika" });
    }
  },

  async updateMe(req, res) {
    try {
      const users = req.app.locals?.users;
      if (!users) {
        return res.status(500).json({ message: "DB kolekcija nije dostupna" });
      }

      const userId = toObjectId(req.user.id);
      const query = { _id: userId };

      const { firstName, lastName, avatarUrl } = req.body || {};

      const updateResult = await users.updateOne(query, {
        $set: {
          firstName: firstName || "",
          lastName: lastName || "",
          avatarUrl: avatarUrl || "",
          updatedAt: new Date(),
        },
      });

      if (updateResult.matchedCount === 0) {
        return res
          .status(404)
          .json({ message: "Korisnik za ažuriranje nije pronađen." });
      }

      const updatedUser = await users.findOne(query, {
        projection: { password: 0 },
      });

      res.json({
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role || "user",
      });
    } catch (err) {
      console.error("Greška u updateMe:", err);
      res.status(500).json({ message: "Greška pri ažuriranju korisnika" });
    }
  },

  async getAdmins(req, res) {
    try {
      const users = req.app.locals?.users;
      if (!users)
        return res.status(500).json({ message: "DB kolekcija nije dostupna" });

      const adminsCursor = users.find(
        { role: "admin" },
        {
          projection: {
            password: 0,
          },
        }
      );

      const adminsRaw = await adminsCursor.toArray();

      const admins = adminsRaw.map((u) => ({
        _id: u._id,
        id: u._id,
        username: u.username,
        email: u.email,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        avatarUrl: u.avatarUrl || "",
        role: u.role || "admin",
      }));

      return res.json(admins);
    } catch (err) {
      console.error("Greška u getAdmins:", err);
      return res
        .status(500)
        .json({ message: "Greška pri dohvaćanju admin korisnika" });
    }
  },
};
