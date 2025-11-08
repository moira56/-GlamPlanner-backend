import { Router } from "express";
import { GalleryController } from "../controllers/galleryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", GalleryController.getAll);

router.post("/", authMiddleware, GalleryController.add);

router.delete(
  "/:id",
  authMiddleware,
  async (req, res, next) => {
    try {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Samo admin može brisati slike" });
      }
      next();
    } catch {
      return res.status(400).json({ message: "Neispravan ID" });
    }
  },
  GalleryController.remove
);

export default router;
