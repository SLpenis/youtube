const express = require('express');
const axios = require('axios');
const cors = require('cors');
const useragent = require('express-useragent');
const requestIp = require('request-ip');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Ваш Telegram Bot Token и Chat ID
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // токен бота
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // куда отправлять сообщения

const bot = new TelegramBot(TELEGRAM_TOKEN);

app.use(cors());
app.use(express.json());
app.use(useragent.express());
app.use(requestIp.mw());

app.use(express.static('public'));

app.get('/collect', async (req, res) => {
  let ip = req.clientIp || '';
  if (req.headers['x-forwarded-for']) {
    const parts = req.headers['x-forwarded-for'].split(',').map(s => s.trim());
    if (parts.length > 0 && parts[0]) {
      ip = parts[0];
    }
  }

  const ua = req.useragent || {};
  const browser = ua.browser || 'Unknown';
  const os = ua.os || 'Unknown';
  const device = ua.platform || 'Unknown';

  let country = 'Unknown';
  let city = 'Unknown';

  try {
    const geo = await axios.get(`http://ip-api.com/json/${ip}`);
    if (geo.data) {
      country = geo.data.country || country;
      city = geo.data.city || city;
    }
  } catch (err) {
    console.error('Geo API error:', err.message);
  }

  const isVpn = false; // Можно добавить логику VPN проверки, если есть API

  // Отправка подробной информации в Telegram
  const timestamp = new Date().toLocaleString();

  // Чтобы получить расширенную информацию с клиента (screen, network и т.п.), сделаем POST на /clientinfo из браузера
  // Здесь отправляем только базовую информацию

  const message = `
New visitor:
IP: ${ip}
Browser: ${browser}
OS: ${os}
Device: ${device}
Country: ${country}
City: ${city}
Timestamp: ${timestamp}
VPN: ${isVpn ? 'Yes' : 'No'}
  `;

  bot.sendMessage(TELEGRAM_CHAT_ID, message);

  // Возвращаем клиенту только ограниченные данные
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

// Новый роут для приема расширенной информации с клиента (screen resolution, user-agent, network type, cookies, device type)
app.post('/clientinfo', (req, res) => {
  const data = req.body || {};

  const message = `
Detailed visitor info:
IP: ${data.ip || 'Unknown'}
Browser: ${data.browser || 'Unknown'}
OS: ${data.os || 'Unknown'}
Device: ${data.device || 'Unknown'}
Country: ${data.country || 'Unknown'}
City: ${data.city || 'Unknown'}
Timestamp: ${data.timestamp || 'Unknown'}
Screen Resolution: ${data.resolution || 'Unknown'}
User-Agent: ${data.useragent || 'Unknown'}
Device Type: ${data.deviceType || 'Unknown'}
Network Type: ${data.networkType || 'Unknown'}
Cookies Enabled: ${data.cookies || 'Unknown'}
VPN: ${data.vpn ? 'Yes' : 'No'}
  `;

  bot.sendMessage(TELEGRAM_CHAT_ID, message);

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
