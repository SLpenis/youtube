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

// Статика из папки public/
app.use(express.static('public'));

// Хранилище IP, чтобы не спамить Telegram при повторных заходах
const submittedIPs = new Map();

app.get('/collect', async (req, res) => {
    const ip = req.clientIp || req.ip;
    const ua = req.useragent;

    const browser = ua.browser || 'Unknown';
    const os = ua.os || 'Unknown';
    const device = ua.platform || 'Unknown';
    const isVpn = false; // Упрощённо — можно добавить сторонний API для проверки VPN

    let country = 'Unknown';
    try {
        const geo = await axios.get(`http://ip-api.com/json/${ip}`);
        if (geo.data && geo.data.country) {
            country = geo.data.country;
        }
    } catch (e) {
        console.warn('Geo lookup failed:', e.message);
    }

    const wasHere = submittedIPs.has(ip);
    submittedIPs.set(ip, Date.now());

    // Telegram сообщение
    const message = `
New visitor:
IP: ${ip}
Browser: ${browser}
OS: ${os}
Device: ${device}
Country: ${country}
VPN: ${isVpn ? 'Yes' : 'No'}
${wasHere ? 'User has already visited.' : ''}
`;

    // Отправка в Telegram, если настроено
    if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.CHAT_ID,
                text: message
            });
        } catch (err) {
            console.error('Failed to send Telegram message:', err.message);
        }
    }

    // Возвращаем данные клиенту
    res.json({
        ip,
        browser,
        os,
        device,
        country,
        vpn: isVpn
    });
});

// POST /submit — получение сообщения от клиента
app.post('/submit', async (req, res) => {
    const ip = req.clientIp || req.ip;
    const text = req.body.message || '';

    const message = `New message from ${ip}:\n${text}`;

    if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.CHAT_ID,
                text: message
            });
        } catch (err) {
            console.error('Failed to send message:', err.message);
        }
    }

    res.json({ success: true });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});
