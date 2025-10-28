import { Router } from "express";
import multer from "multer";
import { UploadController } from "../controllers/uploadController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), UploadController.upload);
router.post("/upload-by-url", UploadController.uploadByUrl);
router.delete("/image/:publicId", UploadController.remove);

export default router;
