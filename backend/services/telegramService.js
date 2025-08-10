let bot;

try {
  const TelegramBot = require('node-telegram-bot-api');
  
  if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: false
    });
  }
} catch (err) {
  console.warn('Telegram package not installed. Install with: npm install node-telegram-bot-api');
}

exports.sendTelegramMessage = async (phone, message) => {
  if (!bot) {
    console.warn('Telegram bot not configured');
    return { success: false, message: 'Telegram service not available' };
  }

  try {
    const chatId = phone.replace('+', '');
    await bot.sendMessage(chatId, message);
    return { success: true };
  } catch (error) {
    console.error('Telegram send error:', error.message);
    return { success: false, error: error.message };
  }
};