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

// Главная страница — статика
app.use(express.static('public'));

// Получение IP и user-agent
app.get('/collect', async (req, res) => {
    const ip = req.clientIp;
    const ua = req.useragent;
    const browser = ua.browser;
    const os = ua.os;
    const device = ua.platform;
    const isVpn = false; // Упрощение: не определяем VPN

    let country = 'Unknown';
    let city = 'Unknown';

    try {
        const geo = await axios.get(`http://ip-api.com/json/${ip}`);
        country = geo.data.country || 'Unknown';
        city = geo.data.city || 'Unknown';
    } catch (error) {
        console.error('Geo API error:', error.message);
    }

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
    } catch (error) {
        console.error('Telegram API error:', error.message);
    }

    res.json({ success: true });
});

// Отправка сообщения вручную
app.post('/submit', async (req, res) => {
    const ip = req.clientIp;
    const text = req.body.message || '';

    try {
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.CHAT_ID,
            text: `New message from ${ip}:\n${text}`
        });
    } catch (error) {
        console.error('Telegram API error:', error.message);
    }

    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});
