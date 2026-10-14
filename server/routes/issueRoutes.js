
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

router.get("/assignees", requireAdmin, getIssueAssignees);
router.get("/:id", getIssueById);

router.patch("/:id/status", requireAdmin, updateIssueStatus);
router.patch("/:id/assign", requireAdmin, assignIssue);

export default router;
