import { ObjectId } from "mongodb";

export const PlanController = {
  async createPlanRequest(req, res) {
    try {
      const plans = req.app.locals?.plans;
      const users = req.app.locals?.users;
      if (!plans || !users) {
        return res.status(500).json({ message: "DB kolekcije nisu dostupne" });
      }

      const { adminId, message } = req.body || {};

      if (!adminId || !message || !message.trim()) {
        return res
          .status(400)
          .json({ message: "adminId i poruka su obavezni" });
      }

      const adminObjectId = new ObjectId(adminId);
      const admin = await users.findOne({ _id: adminObjectId });
      if (!admin || admin.role !== "admin") {
        return res.status(400).json({ message: "Odabrani admin ne postoji" });
      }

      const adminName = `${admin.firstName || ""} ${admin.lastName || ""}`
        .trim()
        .replace(/\s+/g, " ");

      const doc = {
        userId: new ObjectId(req.user.id),
        adminId: adminObjectId,
        fromUsername: req.user.username,
        adminUsername: admin.username,
        adminName: adminName || admin.username,
        message: message.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        replies: [],
        hiddenBy: [],
      };

      const insert = await plans.insertOne(doc);
      return res.status(201).json({ id: insert.insertedId, ...doc });
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
        .find({
          adminId: adminObjectId,
          hiddenBy: { $ne: adminObjectId },
        })
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
        .find({
          userId: userObjectId,
          hiddenBy: { $ne: userObjectId },
        })
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

      const planId = new ObjectId(id);
      const existing = await plans.findOne({ _id: planId });
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
        hiddenBy: [],
      };

      await plans.updateOne(
        { _id: existing._id },
        {
          $push: { replies: reply },
          $set: { updatedAt: new Date() },
        }
      );

      const updated = await plans.findOne({ _id: existing._id });
      return res.json(updated);
    } catch (err) {
      console.error("Greška u respondToPlan:", err);
      return res
        .status(500)
        .json({ message: "Greška pri slanju odgovora korisniku" });
    }
  },

  async hidePlan(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const { id } = req.params;
      const planId = new ObjectId(id);
      const userId = new ObjectId(req.user.id);

      const result = await plans.updateOne(
        { _id: planId },
        { $addToSet: { hiddenBy: userId } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Plan nije pronađen" });
      }

      return res.json({ message: "Upit je skriven" });
    } catch (err) {
      console.error("Greška u hidePlan:", err);
      return res.status(500).json({ message: "Greška pri skrivanju upita" });
    }
  },

  async hideReply(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const { planId, replyId } = req.params;
      const pId = new ObjectId(planId);
      const rId = new ObjectId(replyId);
      const user = req.user;

      const plan = await plans.findOne({ _id: pId });
      if (!plan) {
        return res.status(404).json({ message: "Upit nije pronađen." });
      }

      if (user.role === "admin") {
        await plans.updateOne(
          { _id: pId },
          { $pull: { replies: { _id: rId } } }
        );
      } else {
        const userId = new ObjectId(user.id);
        await plans.updateOne(
          { _id: pId, "replies._id": rId },
          { $addToSet: { "replies.$.hiddenBy": userId } }
        );
      }

      const updated = await plans.findOne({ _id: pId });
      if (!updated) {
        return res
          .status(404)
          .json({ message: "Nije moguće dohvatiti ažurirani upit." });
      }

      return res.json(updated);
    } catch (err) {
      console.error("Greška u hideReply:", err);
      return res
        .status(500)
        .json({ message: "Greška pri rukovanju odgovorom" });
    }
  },
};
