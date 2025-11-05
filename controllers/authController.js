import {
  hashPassword,
  checkPassword,
  generateJWT,
} from "../services/authService.js";

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
      });

      const payload = {
        id: insert.insertedId,
        email,
        username,
        role: userRole,
      };
      const token = generateJWT(payload);

      return res.status(201).json({
        message: "Korisnik uspješno registriran",
        token,
        user: { id: insert.insertedId, email, username, role: userRole },
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
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role || "user",
      });

      return res.json({
        token,
        user: {
          id: user._id,
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
};
