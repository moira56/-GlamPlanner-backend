import { ObjectId } from "mongodb";

function parseTagsParam(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
      }
    } catch {}
    return s
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

export const GalleryController = {
  async getAll(req, res) {
    try {
      const tags = parseTagsParam(req.query.tags);
      const galleryCol = req.app.locals.db.collection("gallery");

      const query = {};

      if (tags.length > 0) {
        query.tags = { $all: tags };
      }

      const images = await galleryCol
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return res.json({
        ok: true,
        source: "mongo",
        items: images,
        nextCursor: null,
      });
    } catch (err) {
      console.error("Greška pri dohvaćanju slika:", err);
      res
        .status(500)
        .json({ ok: false, message: "Greška pri dohvaćanju slika" });
    }
  },

  async add(req, res) {
    try {
      const { url, desc, user, publicId } = req.body || {};
      if (!url)
        return res.status(400).json({ message: "URL slike je obavezan" });

      const tags = parseTagsParam(req.body?.tags);
      const context =
        typeof req.body?.context === "string"
          ? (() => {
              try {
                return JSON.parse(req.body.context);
              } catch {
                return {};
              }
            })()
          : req.body?.context || {};

      const galleryCol = req.app.locals.db.collection("gallery");
      const newImg = {
        url,
        publicId: publicId || null,
        desc: desc || "Bez opisa.",
        user: user || "Nepoznato",
        tags,
        context,
        createdAt: new Date(),
      };

      const result = await galleryCol.insertOne(newImg);
      res.status(201).json({ _id: result.insertedId, ...newImg });
    } catch (err) {
      console.error("Greška pri dodavanju slike:", err);
      res.status(500).json({ message: "Greška pri dodavanju slike" });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "ID slike je obavezan" });

      const galleryCol = req.app.locals.db.collection("gallery");
      const result = await galleryCol.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0)
        return res.status(404).json({ message: "Slika nije pronađena" });

      res.json({ message: "Slika obrisana" });
    } catch (err) {
      console.error("Greška pri brisanju slike:", err);
      res.status(500).json({ message: "Greška pri brisanju slike" });
    }
  },
};
