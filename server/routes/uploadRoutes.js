
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadIssueImage } from "../controllers/uploadController.js";

const router = Router();

router.post("/", protect, upload.single("image"), uploadIssueImage);

export default router;
