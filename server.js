// server.js
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

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('⚠️ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing!');
  process.exit(1);
}

app.use(express.static('public'));

const axiosTelegramSend = async (text) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Telegram send error:', error.message);
  }
};

app.get('/collect', async (req, res) => {
  let ip = req.clientIp || '';
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(',')[0].trim();
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

  res.json({ ip, browser, os, device, country, city, vpn: false });
});

app.post('/clientinfo', async (req, res) => {
  try {
    const {
      ip, browser, os, device, country, city, vpn,
      timestamp, resolution, useragent, deviceType, networkType, cookies
    } = req.body;

    const message = `New visitor:
IP: ${ip}
Browser: ${browser}
OS: ${os}
Device: ${device}
Country: ${country}
City: ${city}
Timestamp: ${timestamp}
Screen Resolution: ${resolution}
User-Agent: ${useragent}
Device Type: ${deviceType}
Network Type: ${networkType}
Cookies Enabled: ${cookies}
VPN: ${vpn ? 'Yes' : 'No'}`;

    await axiosTelegramSend(message);
    res.json({ success: true });
  } catch (error) {
    console.error('Error /clientinfo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
