import { Router } from "express";
import { PlanController } from "../controllers/planController.js";
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, PlanController.createPlanRequest);

router.get("/user", authMiddleware, PlanController.getMyPlanRequestsAsUser);

router.get(
  "/admin",
  authMiddleware,
  isAdmin,
  PlanController.getMyPlanRequestsAsAdmin
);

router.post(
  "/:id/replies",
  authMiddleware,
  isAdmin,
  PlanController.respondToPlan
);

export default router;
