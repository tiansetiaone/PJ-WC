import React from "react";
import "./../styles/NotificationManagement.css";

const notifications = [
  { id: 1, title: "Dark Mode is Here!", message: "🎉 We're excited to announce that Dark Mode is now available on both web and...", date: "24 June 2025" },
  { id: 2, title: "Faster & Smoother Experience", message: "🚀 Our team has rolled out major performance improvements in this update...", date: "24 June 2025" },
  { id: 3, title: "Enhanced Account Security", message: "🛡️ Your security is our priority. We've enhanced account protection by adding...", date: "24 June 2025" },
  { id: 4, title: "Customize Your Profile", message: "📝 We've introduced profile customization options! You can now add a short bio...", date: "24 June 2025" },
  { id: 5, title: "New Analytics Dashboard", message: "📊 Say hello to your new dashboard! With improved analytics and detailed insi...", date: "24 June 2025" },
  { id: 6, title: "Smarter Inbox, Better Workflow", message: "📩 Your inbox just got smarter. We've grouped similar notifications, added qu...", date: "24 June 2025" },
  { id: 7, title: "Take Control of Your Notifications", message: "🔔 You now have more control over your reminders and notifications. Set custo...", date: "24 June 2025" },
  { id: 8, title: "Mobile App Gets Major Update", message: "📱 Big update for our mobile app! We've added support for the latest devices...", date: "24 June 2025" },
  { id: 9, title: "Earn More with Referrals", message: "💡 Our referral program just got better. Invite your friends to join, and you...", date: "24 June 2025" },
  { id: 10, title: "We’re Here to Help — Instantly!", message: "💬 We’re here to help — anytime you need it. With our new live chat support...", date: "24 June 2025" },
];

export default function NotificationManagement() {
  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2>Notification Management</h2>
        <button className="btn-create">+ Create New Notification</button>
      </div>

      <div className="notification-table">
        <div className="table-header">
          <input
            type="text"
            placeholder="Search referral registered history by full name, email, or registered via user's link..."
          />
          <select>
            <option>Month</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Title</th>
              <th>Message</th>
              <th>Publish Date</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notif, index) => (
              <tr key={notif.id}>
                <td>{index + 1}</td>
                <td>{notif.title}</td>
                <td>{notif.message}</td>
                <td>{notif.date}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <p>10 of 11 data</p>
          <div>
            <button>{"<"}</button>
            <button className="active">1</button>
            <button>2</button>
            <button>{">"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
