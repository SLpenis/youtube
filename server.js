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

  const isVpn = false;

  submittedIPs.set(ip, Date.now());

  // Возвращаем только базовую инфу клиенту
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

// Новый роут для расширенной инфы с клиента
app.post('/clientinfo', async (req, res) => {
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

  const isVpn = false;

  /
