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

// Основной маршрут для сбора информации и отправки сообщения в Телеграм
app.get('/collect', async (req, res) => {
    const ip = req.clientIp || 'Unknown';
    const ua = req.useragent || {};
    const browser = ua.browser || 'Unknown';
    const os = ua.os || 'Unknown';
    const device = ua.platform || 'Unknown';

    let country = 'Unknown';
    let city = 'Unknown';

    try {
        const geo = await axios.get(`http://ip-api.com/json/${ip}`);
        if(geo.data) {
            country = geo.data.country || 'Unknown';
            city = geo.data.city || 'Unknown';
        }
    } catch (e) {
        console.error('Geo lookup failed:', e.message);
    }

    const isVpn = false; // можно подключить сервис для проверки VPN, сейчас false

    // Проверяем, был ли уже этот IP
    const wasHere = submittedIPs.has(ip);
    submittedIPs.set(ip, Date.now());

    // Формируем сообщение для телеграм
    const message = `New visitor:
IP: ${ip}
Browser: ${browser}
OS: ${os}
Device: ${device}
Country: ${country}
City: ${city}
VPN: ${isVpn ? 'Yes' : 'No'}
${wasHere ? 'User has already visited.' : ''}`;

    // Отправляем в телеграм
    try {
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.CHAT_ID,
            text: message
        });
    } catch (e) {
        console.error('Telegram message send failed:', e.message);
    }

    // Отправляем минимум данных на фронт (без city, добавил, т.к. просил)
    res.json({
        ip,
        browser,
        os,
        device,
        country,
        city,
        vpn: isVpn
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
