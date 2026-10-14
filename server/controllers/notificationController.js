import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
  try {
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("issue", "title status category")
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .lean();
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      readAt: null,
    });
    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) {
      const exists = await Notification.exists({ _id: req.params.id, recipient: req.user._id });
      if (!exists) return res.status(404).json({ success: false, message: "Notification not found." });
      return res.status(200).json({ success: true, message: "Notification already read." });
    }
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
