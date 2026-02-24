import { Notification } from "../models/notification.model.js";

export const getUnreadNotifications = async (req, res) => {
  try {
    const participantId = req.user.id;
    const notifications = await Notification.find({
      recipient: participantId,
      isRead: false,
    })
      .populate("relatedEvent", "eventName")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("getUnreadNotifications error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const participantId = req.user.id;
    await Notification.updateMany(
      { recipient: participantId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("markNotificationsRead error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
