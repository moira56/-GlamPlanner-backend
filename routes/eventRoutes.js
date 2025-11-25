import { Router } from "express";
import { EventController } from "../controllers/eventController.js";
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", EventController.getAllEvents);
router.post("/", authMiddleware, isAdmin, EventController.createEvent);

router.get("/:id", EventController.getEventById);
router.put("/:id", authMiddleware, isAdmin, EventController.updateEvent);
router.delete(
  "/:id/images",
  authMiddleware,
  isAdmin,
  EventController.deleteContentImage
);
router.delete("/:id", authMiddleware, isAdmin, EventController.deleteEvent);

export default router;
