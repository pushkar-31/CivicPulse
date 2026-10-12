
import { Router } from "express";
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
} from "../controllers/issueController.js";
import {
  protect,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.route("/")
  .post(createIssue)
  .get(getIssues);

router.get("/:id", getIssueById);

router.patch("/:id/status", requireAdmin, updateIssueStatus);

export default router;
