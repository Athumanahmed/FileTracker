import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";

export const listMyNotifications = asyncHandler(async (req, res) => {
  const { items, meta } = await notificationService.listMyNotifications({ userId: req.user.userId, query: req.query });
  res.status(200).json({ success: true, message: "Notifications retrieved successfully.", data: items, meta });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead({ id: req.params.id, userId: req.user.userId });
  res.status(200).json({ success: true, message: "Notification marked as read.", data: notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(req.user.userId);
  res.status(200).json({ success: true, message: "All notifications marked as read.", data: result });
});

export const listMyPreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.listMyPreferences(req.user.userId);
  res.status(200).json({ success: true, message: "Notification preferences retrieved successfully.", data: preferences });
});

export const setMyPreference = asyncHandler(async (req, res) => {
  const preference = await notificationService.setMyPreference({
    userId: req.user.userId,
    type: req.body.type,
    channel: req.body.channel,
    isEnabled: req.body.isEnabled,
  });
  res.status(200).json({ success: true, message: "Notification preference updated successfully.", data: preference });
});
