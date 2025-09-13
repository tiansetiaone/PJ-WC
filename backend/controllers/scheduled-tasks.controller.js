// scheduled-tasks.js
const db = require("./config/db");

async function syncUserCredits() {
  try {
    console.log("Starting credit sync...");
    
    // Update total_credit dari sum deposits approved
    await db.query(`
      UPDATE users u
      SET u.total_credit = (
        SELECT COALESCE(SUM(d.credit), 0)
        FROM deposits d
        WHERE d.user_id = u.id AND d.status = 'approved'
      )
      WHERE u.id IN (SELECT DISTINCT user_id FROM deposits WHERE status = 'approved')
    `);
    
    console.log("Credit sync completed successfully");
  } catch (err) {
    console.error("Credit sync error:", err);
  }
}

// Jalankan sekali saat startup
syncUserCredits();

// Jadwalkan sync harian
setInterval(syncUserCredits, 24 * 60 * 60 * 1000);

module.exports = { syncUserCredits };