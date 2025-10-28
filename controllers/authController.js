import {
  hashPassword,
  checkPassword,
  generateJWT,
} from "../services/authService.js";

export const AuthController = {
  async register(req, res) {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "username i password su obavezni" });
      }

      const users = req.app.locals.users;
      const exists = await users.findOne({ username });
      if (exists)
        return res.status(409).json({ message: "Korisnik već postoji" });

      const passwordHash = await hashPassword(password);
      const { insertedId } = await users.insertOne({
        username,
        password: passwordHash,
        createdAt: new Date(),
      });

      const token = generateJWT({ id: insertedId, username });
      return res.status(201).json({ id: insertedId, username, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Greška pri registraciji" });
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "username i password su obavezni" });
      }

      const users = req.app.locals.users;
      const user = await users.findOne({ username });
      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });

      const ok = await checkPassword(password, user.password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      const token = generateJWT({ id: user._id, username: user.username });
      return res.json({ token, username: user.username });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Greška pri prijavi" });
    }
  },
};
