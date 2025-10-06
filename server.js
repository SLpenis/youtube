window.addEventListener('DOMContentLoaded', () => {
  fetch('/collect')
    .then(res => res.json())
    .then(data => {
      // Показываем на сайте только базовую информацию
      document.getElementById('ip').textContent = data.ip || 'Unknown';
      document.getElementById('browser').textContent = data.browser || 'Unknown';
      document.getElementById('os').textContent = data.os || 'Unknown';
      document.getElementById('device').textContent = data.device || 'Unknown';
      document.getElementById('country').textContent = data.country || 'Unknown';
      document.getElementById('city').textContent = data.city || 'Unknown';
      document.getElementById('vpn').textContent = data.vpn ? 'Yes' : 'No';

      // Собираем расширенную информацию для отправки в Телеграм
      const timestamp = new Date().toLocaleString();
      const resolution = `${window.screen.width} x ${window.screen.height}`;
      const useragent = navigator.userAgent;
      const ua = navigator.userAgent.toLowerCase();
      const deviceType = /mobile|android|iphone|ipad|phone/i.test(ua) ? 'Mobile' : 'Desktop';

      let networkType = 'Unknown';
      if (navigator.connection && navigator.connection.effectiveType) {
        networkType = navigator.connection.effectiveType;
      }

      const cookies = navigator.cookieEnabled ? 'Yes' : 'No';

      // Отправляем расширенную инфу на сервер
      fetch('/clientinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: data.ip,
          browser: data.browser,
          os: data.os,
          device: data.device,
          country: data.country,
          city: data.city,
          timestamp,
          resolution,
          useragent,
          deviceType,
          networkType,
          cookies,
          vpn: data.vpn
        })
      });
    })
    .catch(err => {
      console.error('Error fetching visitor data:', err);
    });
});
