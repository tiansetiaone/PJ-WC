// services/notificationService.js
import axios from "axios";

export const fetchNotifications = async (token) => {
  try {
    const response = await axios.get("/api/notifications", {
      headers: {
        Authorization: `Bearer ${token}`, // karena pakai authMiddleware
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};
