const express = require('express');
const axios = require('axios');
const cors = require('cors');
const useragent = require('express-useragent');
const requestIp = require('request-ip');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(useragent.express());
app.use(requestIp.mw());

const submittedIPs = new Map();

// Статические файлы (твоя HTML-страница)
app.use(express.static('public'));

// Сбор инфы о пользователе
app.get('/collect', async (req, res) => {
  const ip = req.clientIp;
  const ua = req.useragent;

  const browser = ua.browser || 'Unknown';
  const os = ua.os || 'Unknown';
  const device = ua.platform || 'Unknown';
  const isVpn = false;

  let country = 'Unknown';
  let city = 'Unknown';

  try {
    // Используем auto-detection IP API
    const geo = await axios.get(`http://ip-api.com/json/`);
    country = geo.data.country || 'Unknown';
    city = geo.data.city || 'Unknown';
  } catch (err) {
    console.error('Geo API error:', err.message);
  }

  // Логика "повторного визита"
  const wasHere = submittedIPs.has(ip);
  submittedIPs.set(ip, Date.now());

  const message = `
New visitor:
IP: ${ip}
Browser: ${browser}
OS: ${os}
Device: ${device}
Country: ${country}
City: ${city}
VPN: ${isVpn ? 'Yes' : 'No'}
${wasHere ? 'User has already visited.' : ''}
`;

  // Отправка в Telegram
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.CHAT_ID,
      text: message
    });
  } catch (err) {
    console.error('Telegram API error:', err.message);
  }

  // 🔥 Возвращаем данные во фронтенд
  res.json({
    success: true,
    ip,
    browser,
    os,
    device,
    country,
    city,
    vpn: isVpn
  });
});

// Приём сообщений от пользователя
app.post('/submit', async (req, res) => {
  const ip = req.clientIp;
  const text = req.body.message || '';

  try {
    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.CHAT_ID,
      text: `New message from ${ip}:\n${text}`
    });
  } catch (err) {
    console.error('Telegram API error:', err.message);
  }

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
