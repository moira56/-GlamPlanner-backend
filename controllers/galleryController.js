import { ObjectId } from "mongodb";

export const GalleryController = {
  async getAll(req, res) {
    try {
      const galleryCol = req.app.locals.db.collection("gallery");
      const images = await galleryCol.find().sort({ createdAt: -1 }).toArray();
      res.json(images);
    } catch (err) {
      console.error("Greška pri dohvaćanju slika:", err);
      res.status(500).json({ message: "Greška pri dohvaćanju slika" });
    }
  },

  async add(req, res) {
    try {
      const { url, desc, user } = req.body;
      if (!url)
        return res.status(400).json({ message: "URL slike je obavezan" });

      const galleryCol = req.app.locals.db.collection("gallery");
      const newImg = {
        url,
        desc: desc || "Bez opisa.",
        user: user || "Nepoznato",
        createdAt: new Date(),
      };

      const result = await galleryCol.insertOne(newImg);
      res.status(201).json({
        _id: result.insertedId,
        ...newImg,
      });
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
