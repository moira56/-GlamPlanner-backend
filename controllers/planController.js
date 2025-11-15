import { ObjectId } from "mongodb";

export const PlanController = {
  async createPlanRequest(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const { adminId, message } = req.body || {};

      if (!adminId || !message || !message.trim()) {
        return res
          .status(400)
          .json({ message: "adminId i poruka su obavezni" });
      }

      const doc = {
        userId: new ObjectId(req.user.id),
        adminId: new ObjectId(adminId),
        fromUsername: req.user.username,
        message: message.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        replies: [],
      };

      const insert = await plans.insertOne(doc);

      return res.status(201).json({
        id: insert.insertedId,
        ...doc,
      });
    } catch (err) {
      console.error("Greška u createPlanRequest:", err);
      return res
        .status(500)
        .json({ message: "Greška pri slanju zahtjeva adminu" });
    }
  },

  async getMyPlanRequestsAsAdmin(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const adminObjectId = new ObjectId(req.user.id);

      const cursor = plans
        .find({ adminId: adminObjectId })
        .sort({ createdAt: -1 });

      const list = await cursor.toArray();

      return res.json(list);
    } catch (err) {
      console.error("Greška u getMyPlanRequestsAsAdmin:", err);
      return res
        .status(500)
        .json({ message: "Greška pri dohvaćanju zahtjeva" });
    }
  },

  async getMyPlanRequestsAsUser(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const userObjectId = new ObjectId(req.user.id);

      const cursor = plans
        .find({ userId: userObjectId })
        .sort({ createdAt: -1 });

      const list = await cursor.toArray();

      return res.json(list);
    } catch (err) {
      console.error("Greška u getMyPlanRequestsAsUser:", err);
      return res
        .status(500)
        .json({ message: "Greška pri dohvaćanju tvojih upita" });
    }
  },

  async respondToPlan(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const { id } = req.params;
      const { message, imageUrls } = req.body || {};

      if (!message || !message.trim()) {
        return res
          .status(400)
          .json({ message: "Poruka za odgovor je obavezna" });
      }

      console.log("respondToPlan - id param:", id);

      const possibleIds = [];
      if (ObjectId.isValid(id)) {
        possibleIds.push(new ObjectId(id));
      }
      possibleIds.push(id);

      let filter;
      if (possibleIds.length === 1) {
        filter = { _id: possibleIds[0] };
      } else {
        filter = { _id: { $in: possibleIds } };
      }

      console.log("respondToPlan - filter koji koristimo:", filter);

      const existing = await plans.findOne(filter);
      console.log(
        "respondToPlan - pronađeni plan:",
        existing ? existing._id : null,
        existing ? typeof existing._id : null
      );

      if (!existing) {
        return res.status(404).json({ message: "Plan nije pronađen" });
      }

      const images = Array.isArray(imageUrls)
        ? imageUrls.filter((u) => typeof u === "string" && u.trim() !== "")
        : [];

      const reply = {
        _id: new ObjectId(),
        adminId: new ObjectId(req.user.id),
        adminUsername: req.user.username,
        message: message.trim(),
        imageUrls: images,
        createdAt: new Date(),
      };

      await plans.updateOne(
        { _id: existing._id },
        {
          $push: { replies: reply },
          $set: { updatedAt: new Date() },
        }
      );

      const updated = await plans.findOne({ _id: existing._id });

      console.log("respondToPlan - ažurirani plan:", updated?._id);

      return res.json(updated);
    } catch (err) {
      console.error("Greška u respondToPlan:", err);
      return res
        .status(500)
        .json({ message: "Greška pri slanju odgovora korisniku" });
    }
  },
};
