// services/notification.js
exports.sendDepositNotification = async (userId, depositId) => {
  const [user] = await db.query(`SELECT email FROM users WHERE id = ?`, [userId]);
  const [deposit] = await db.query(`SELECT * FROM deposits WHERE id = ?`, [depositId]);

  // Email notification
  await sendEmail({
    to: user[0].email,
    subject: `Deposit ${deposit[0].status}`,
    html: `
      <p>Deposit ID: ${depositId}</p>
      <p>Amount: ${deposit[0].amount} USDT</p>
      <p>Status: ${deposit[0].status.toUpperCase()}</p>
    `
  });

  // WhatsApp notification (opsional)
  if (deposit[0].status === 'approved') {
    await sendWhatsApp(
      user[0].phone,
      `Deposit Anda sebesar ${deposit[0].amount} USDT sudah diterima. Saldo sekarang: X USDT`
    );
  }
};