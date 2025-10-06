const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '8390711661:AAHpc4nWj1Id92M6TYTf2NA_aAL28t02b5M';
const TELEGRAM_CHAT_ID = '5349400039';

async function sendTestMessage() {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: 'Test message from your bot ✅',
    });
    console.log('Message sent:', res.data);
  } catch (err) {
    console.error('Telegram send error:', err.response ? err.response.data : err.message);
  }
}

sendTestMessage();
