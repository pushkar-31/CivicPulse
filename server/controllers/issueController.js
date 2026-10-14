import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { findSimilarIssues } from "../utils/duplicateDetection.js";
import { addSlaDetails } from "../utils/slaTracking.js";

export const createIssue = async (req, res, next) => {
  try {
    const { title, description, category, priority, location, imageUrl, allowDuplicate } = req.body;

    if (!title?.trim() || !description?.trim() || !category || !location?.address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category, and location address are required.",
      });
    }

    if (location.coordinates !== undefined) {
      const coordinates = location.coordinates;
      if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)) ||
        coordinates[0] < -180 || coordinates[0] > 180 ||
        coordinates[1] < -90 || coordinates[1] > 90
      ) {
        return res.status(400).json({
          success: false,
          message: "Coordinates must be [longitude, latitude] with valid values.",
        });
      }
    }

    if (allowDuplicate !== true) {
      const similarIssues = await findSimilarIssues({
        title: title.trim(),
        description: description.trim(),
        category,
        coordinates: location.coordinates,
      });

      if (similarIssues.length > 0) {
        return res.status(200).json({
          success: true,
          duplicateWarning: true,
          message: "Similar open issues were found nearby.",
          similarIssues,
        });
      }
    }

    const issue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || "medium",
      location: {
        address: location.address.trim(),
        ...(Array.isArray(location.coordinates) ? { coordinates: location.coordinates } : {}),
      },
      imageUrl: imageUrl || "",
      reportedBy: req.user._id,
      status: "reported",
      statusHistory: [{
        status: "reported",
        changedBy: req.user._id,
        note: "Issue reported",
        changedAt: new Date(),
      }],
    });

    return res.status(201).json({
      success: true,
      message: "Issue reported successfully.",
      issue: addSlaDetails(issue.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

export const getIssues = async (req, res, next) => {
  try {
    const { category, status, mine, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (mine === "true") filter.reportedBy = req.user._id;

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate("reportedBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Issue.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      issues: issues.map((issue) => addSlaDetails(issue)),
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid issue ID." });
    }

    const issue = await Issue.findById(id)
      .populate("reportedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("statusHistory.changedBy", "name role");

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found." });
    }

    if (req.user.role !== "admin" && issue.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this issue.",
      });
    }

    return res.status(200).json({ success: true, issue: addSlaDetails(issue.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const updateIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, resolutionNote, resolutionImageUrl } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid issue ID." });
    }

    if (!["reported", "in-progress", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid issue status." });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found." });
    }

    const finalResolutionNote = resolutionNote || note || "";
    if (status === "resolved" && !finalResolutionNote.trim()) {
      return res.status(400).json({
        success: false,
        message: "A resolution note is required to resolve an issue.",
      });
    }

    issue.status = status;
    if (status === "resolved") {
      issue.resolutionNote = finalResolutionNote.trim();

      if (resolutionImageUrl !== undefined) {
        if (typeof resolutionImageUrl !== "string" || !resolutionImageUrl.startsWith("https://")) {
          return res.status(400).json({
            success: false,
            message: "A valid resolution image URL is required.",
          });
        }
        issue.resolutionImageUrl = resolutionImageUrl;
      }
    }

    issue.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: finalResolutionNote.trim() || `Status changed to ${status}`,
      changedAt: new Date(),
    });

    await issue.save();

    if (issue.reportedBy && issue.reportedBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: issue.reportedBy,
        issue: issue._id,
        type: status === "resolved" ? "resolution" : "status",
        title: status === "resolved" ? "Issue resolved" : "Issue status updated",
        message: `"${issue.title}" is now ${status.replace("-", " ")}.${finalResolutionNote.trim() ? ` ${finalResolutionNote.trim()}` : ""}`,
      });
    }

    const updatedIssue = await Issue.findById(issue._id)
      .populate("reportedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("statusHistory.changedBy", "name role");

    return res.status(200).json({
      success: true,
      message: "Issue status updated successfully.",
      issue: addSlaDetails(updatedIssue.toObject()),
    });
  } catch (error) {
    next(error);
  }
};


export const getIssueAssignees = async (req, res, next) => {
  try {
    const users = await User.find({ role: "citizen" })
      .select("name email")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const assignIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid issue ID." });
    }

    if (assignedTo !== null && !mongoose.isValidObjectId(assignedTo)) {
      return res.status(400).json({ success: false, message: "Choose a valid assignee." });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found." });
    }

    if (assignedTo) {
      const user = await User.findOne({ _id: assignedTo, role: "citizen" }).select("_id");
      if (!user) {
        return res.status(400).json({ success: false, message: "Assignee not found." });
      }
    }

    const previousAssignee = issue.assignedTo?.toString();
    issue.assignedTo = assignedTo || null;
    if (assignedTo && assignedTo !== previousAssignee && assignedTo !== req.user._id.toString()) {
      await Notification.create({
        recipient: assignedTo,
        issue: issue._id,
        type: "assignment",
        title: "Issue assigned to you",
        message: `You have been assigned "${issue.title}".`,
      });
    }
    if (issue.reportedBy && issue.reportedBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: issue.reportedBy,
        issue: issue._id,
        type: "assignment",
        title: assignedTo ? "Issue assignment updated" : "Issue unassigned",
        message: assignedTo ? `"${issue.title}" has been assigned to a team member.` : `The assignment for "${issue.title}" has been removed.`,
      });
    }
    issue.statusHistory.push({
      status: issue.status,
      changedBy: req.user._id,
      note: assignedTo ? "Issue assigned to a team member" : "Issue assignment removed",
      changedAt: new Date(),
    });
    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate("reportedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("statusHistory.changedBy", "name role");

    return res.status(200).json({
      success: true,
      message: assignedTo ? "Issue assigned successfully." : "Issue unassigned successfully.",
      issue: updatedIssue,
    });
  } catch (error) {
    next(error);
  }
};
