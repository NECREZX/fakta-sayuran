importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  workbox.precaching.precacheAndRoute([
    { url: 'index.html', revision: '2' },
    { url: 'assets/css/styles.css', revision: '2' },
    { url: 'assets/js/core/app.js', revision: '2' },
    { url: 'assets/js/core/config.js', revision: '2' },
    { url: 'assets/js/core/utils.js', revision: '2' },
    { url: 'assets/js/services/camera.service.js', revision: '2' },
    { url: 'assets/js/services/detection.service.js', revision: '2' },
    { url: 'assets/js/services/facts.service.js', revision: '2' },
    { url: 'assets/js/ui/ui.handler.js', revision: '2' },
    { url: 'manifest.json', revision: '2' },
    { url: 'model/model.json', revision: '2' },
    { url: 'model/metadata.json', revision: '2' },
    { url: 'model/weights.bin', revision: '2' },
    { url: 'assets/icons/icon-192x192.png', revision: '2' },
    { url: 'assets/icons/icon-512x512.png', revision: '2' },
    { url: 'assets/icons/apple-touch-icon.png', revision: '2' },
    { url: 'assets/icons/favicon.ico', revision: '2' },
    { url: '/', revision: '2' }
  ]);

} else {
  console.log("Workbox didn't load");
}
