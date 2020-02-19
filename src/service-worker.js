// TUTORIAL
// GIT https://github.com/kefranabg/bento-starter/
// Skip waiting: https://gitlab.com/kobededecker/vue-pwa-example/blob/master/src/registerServiceWorker.js

/* eslint-disable no-console */

workbox.setConfig({
  debug: false,
});

self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

// Redirect to index.html if sw cannot find matching route
workbox.routing.registerNavigationRoute('/index.html', {
  /* Do not redirect routes used by firebase auth  */
  blacklist: [
    new RegExp('/__/auth/handler'),
    new RegExp('/__/auth/iframe'),
    new RegExp('/.well-known'),
  ],
});

workbox.routing.registerRoute(
    /\.(?:png|gif|jpg|jpeg|svg)$/,
    workbox.strategies.staleWhileRevalidate({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
);

workbox.routing.registerRoute(
    /^https:\/\/fonts/,
    workbox.strategies.staleWhileRevalidate({
      cacheName: 'fonts.googleapis',
      plugins: [],
    }),
    'GET'
);

// install new service worker when ok, then reload page.
self.addEventListener('message', (msg) => {
  if (msg.data.action == 'skipWaiting') {
    self.skipWaiting();
  }
});
