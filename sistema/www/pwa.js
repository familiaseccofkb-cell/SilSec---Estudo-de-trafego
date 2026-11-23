// Registra o aplicativo instalável (PWA). Funciona no Chrome/Edge (Windows, Android) e no Safari (iPhone/iPad).
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
// Versão para computador (servidor local): avisa que a janela continua aberta; sem aviso, o servidor encerra sozinho.
if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') setInterval(() => fetch('/saude', {cache: 'no-store'}).catch(() => {}), 30e3);
