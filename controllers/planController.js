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

      const possibleIds = [];
      if (ObjectId.isValid(id)) possibleIds.push(new ObjectId(id));
      possibleIds.push(id);

      const filter =
        possibleIds.length === 1
          ? { _id: possibleIds[0] }
          : { _id: { $in: possibleIds } };

      const existing = await plans.findOne(filter);
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

      return res.json(updated);
    } catch (err) {
      console.error("Greška u respondToPlan:", err);
      return res
        .status(500)
        .json({ message: "Greška pri slanju odgovora korisniku" });
    }
  },

  async deletePlan(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const { id } = req.params;
      const planId = ObjectId.isValid(id) ? new ObjectId(id) : id;

      const existing = await plans.findOne({ _id: planId });
      if (!existing) {
        return res.status(404).json({ message: "Plan nije pronađen" });
      }

      await plans.deleteOne({ _id: existing._id });

      return res.json({ message: "Plan je obrisan" });
    } catch (err) {
      console.error("Greška u deletePlan:", err);
      return res.status(500).json({ message: "Greška pri brisanju plana" });
    }
  },

  async deleteReply(req, res) {
    try {
      const plans = req.app.locals?.plans;
      if (!plans) {
        return res
          .status(500)
          .json({ message: "DB kolekcija 'plans' nije dostupna" });
      }

      const { planId, replyId } = req.params;
      const planKey = ObjectId.isValid(planId) ? new ObjectId(planId) : planId;

      const plan = await plans.findOne({ _id: planKey });
      if (!plan) {
        return res.status(404).json({ message: "Plan nije pronađen" });
      }

      const reply = (plan.replies || []).find(
        (r) => r._id?.toString() === replyId
      );
      if (!reply) {
        return res.status(404).json({ message: "Odgovor nije pronađen" });
      }

      const isAdminUser = req.user.role === "admin";

      if (isAdminUser) {
        if (reply.adminId?.toString() !== req.user.id) {
          return res
            .status(403)
            .json({ message: "Nemaš dozvolu za brisanje ovog odgovora" });
        }
      } else {
        if (plan.userId?.toString() !== req.user.id) {
          return res
            .status(403)
            .json({ message: "Nemaš dozvolu za brisanje ovog odgovora" });
        }
      }

      await plans.updateOne(
        { _id: plan._id },
        {
          $pull: { replies: { _id: reply._id } },
          $set: { updatedAt: new Date() },
        }
      );

      const updated = await plans.findOne({ _id: plan._id });
      return res.json(updated);
    } catch (err) {
      console.error("Greška u deleteReply:", err);
      return res.status(500).json({ message: "Greška pri brisanju odgovora" });
    }
  },
};
