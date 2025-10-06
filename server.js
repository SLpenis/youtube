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

// Статика — папка public с index.html и прочим
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

  // Пока нет реальной VPN проверки — false
  const isVpn = false;

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

  try {
    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.CHAT_ID,
      text: message
    });
  } catch (err) {
    console.error('Telegram API error:', err.message);
  }

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

app.post('/submit', async (req, res) => {
  let ip = req.clientIp || '';
  if (req.headers['x-forwarded-for']) {
    const parts = req.headers['x-forwarded-for'].split(',').map(s => s.trim());
    if (parts.length > 0 && parts[0]) {
      ip = parts[0];
    }
  }
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
