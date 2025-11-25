import { ObjectId } from "mongodb";

export const EventController = {
  async createEvent(req, res) {
    try {
      const events = req.app.locals.events;
      if (!events) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'events' nije dostupna" });
      }

      const { title, description, imageUrl, contentImageUrls } = req.body;

      if (!title || !description || !imageUrl) {
        return res
          .status(400)
          .json({ message: "Naslov, opis i glavna slika su obavezni." });
      }

      const newEvent = {
        title,
        description,
        imageUrl,
        contentImageUrls: Array.isArray(contentImageUrls)
          ? contentImageUrls
          : [],
        createdAt: new Date(),
        createdBy: new ObjectId(req.user.id),
      };

      const result = await events.insertOne(newEvent);
      res.status(201).json({ id: result.insertedId, ...newEvent });
    } catch (err) {
      console.error("Greška u createEvent:", err);
      res
        .status(500)
        .json({ message: "Greška na serveru pri kreiranju događaja." });
    }
  },

  async getAllEvents(req, res) {
    try {
      const events = req.app.locals.events;
      if (!events) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'events' nije dostupna" });
      }
      const allEvents = await events.find({}).sort({ createdAt: -1 }).toArray();
      res.status(200).json(allEvents);
    } catch (err) {
      console.error("Greška u getAllEvents:", err);
      res
        .status(500)
        .json({ message: "Greška na serveru pri dohvaćanju događaja." });
    }
  },

  async getEventById(req, res) {
    try {
      const events = req.app.locals.events;
      if (!events) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'events' nije dostupna" });
      }
      const event = await events.findOne({ _id: new ObjectId(req.params.id) });
      if (!event) {
        return res.status(404).json({ message: "Događaj nije pronađen." });
      }
      res.status(200).json(event);
    } catch (err) {
      console.error("Greška u getEventById:", err);
      res.status(500).json({ message: "Greška pri dohvaćanju događaja." });
    }
  },

  async updateEvent(req, res) {
    try {
      const events = req.app.locals.events;
      const { title, description, imageUrl, newContentImages } = req.body;
      const { id } = req.params;

      const updateFields = { $set: {}, $addToSet: {} };
      if (title) updateFields.$set.title = title;
      if (description) updateFields.$set.description = description;
      if (imageUrl) updateFields.$set.imageUrl = imageUrl;

      if (newContentImages && newContentImages.length > 0) {
        updateFields.$addToSet.contentImageUrls = { $each: newContentImages };
      }

      const result = await events.updateOne(
        { _id: new ObjectId(id) },
        updateFields
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ message: "Događaj za ažuriranje nije pronađen." });
      }

      const updatedEvent = await events.findOne({ _id: new ObjectId(id) });
      res.status(200).json(updatedEvent);
    } catch (err) {
      console.error("Greška u updateEvent:", err);
      res.status(500).json({ message: "Greška pri ažuriranju događaja." });
    }
  },

  async deleteContentImage(req, res) {
    try {
      const events = req.app.locals.events;
      const { imageUrl } = req.body;
      const { id } = req.params;

      if (!imageUrl) {
        return res.status(400).json({ message: "URL slike je obavezan." });
      }

      const result = await events.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { contentImageUrls: imageUrl } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Događaj nije pronađen." });
      }

      res.status(200).json({ message: "Slika je obrisana." });
    } catch (err) {
      console.error("Greška u deleteContentImage:", err);
      res.status(500).json({ message: "Greška pri brisanju slike." });
    }
  },

  async deleteEvent(req, res) {
    try {
      const events = req.app.locals.events;
      const { id } = req.params;

      const result = await events.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ message: "Događaj za brisanje nije pronađen." });
      }

      res.status(200).json({ message: "Događaj je trajno obrisan." });
    } catch (err) {
      console.error("Greška u deleteEvent:", err);
      res.status(500).json({ message: "Greška pri brisanju događaja." });
    }
  },
};
