importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  workbox.precaching.precacheAndRoute([
    { url: 'index.html', revision: '1' },
    { url: 'assets/css/styles.css', revision: '1' },
    { url: 'assets/js/core/app.js', revision: '1' },
    { url: 'assets/js/core/config.js', revision: '1' },
    { url: 'assets/js/core/utils.js', revision: '1' },
    { url: 'assets/js/services/camera.service.js', revision: '1' },
    { url: 'assets/js/services/detection.service.js', revision: '1' },
    { url: 'assets/js/services/facts.service.js', revision: '1' },
    { url: 'assets/js/ui/ui.handler.js', revision: '1' },
    { url: 'manifest.json', revision: '1' },
    { url: 'model/model.json', revision: '1' },
    { url: 'model/metadata.json', revision: '1' },
    { url: 'model/weights.bin', revision: '1' },
    { url: '/', revision: '1' }
  ]);
  
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://huggingface.co' || url.origin === 'https://cdn.jsdelivr.net',
    new workbox.strategies.CacheFirst({
      cacheName: 'external-models-cache',
    })
  );
} else {
  console.log("Workbox didn't load");
}
