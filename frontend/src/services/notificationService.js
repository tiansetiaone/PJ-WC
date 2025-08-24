// src/services/notificationService.js
import { fetchApi } from ".././utils/api";

// GET notifications (shared untuk user & admin)
export const getNotifications = () => {
  return fetchApi("/notifications");
};

// GET all notifications (admin only)
export const getAllNotifications = () => {
  return fetchApi("/notifications/admin");
};

// (Opsional) GET notification by id (admin only) — kalau suatu saat butuh prefill by id
export const getNotificationById = (id) => {
  return fetchApi(`/notifications/admin/${id}`);
};

// POST create new notification (admin only)
export const createNotification = (data) => {
  return fetchApi("/notifications/admin", {
    method: "POST",
    body: data,
  });
};

// ✅ PUT update notification (admin only)
export const updateNotification = (id, data) => {
  return fetchApi(`/notifications/admin/${id}`, {
    method: "PUT",
    body: data,
  }).then((res) => res.notification || res); // controller mengembalikan { notification: {...} }
};

// DELETE notification
export const deleteNotification = (id) => {
  return fetchApi(`/notifications/admin/${id}`, {
    method: "DELETE",
  });
};
