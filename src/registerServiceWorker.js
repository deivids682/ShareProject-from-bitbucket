/* eslint-disable no-console */

import {register} from 'register-service-worker';

// check if browser supports SW and if in production mode
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log(
          'App is being served from cache by a service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB'
      );
    },
    cached() {
      console.log('Content has been cached for offline use.');
    },
    updatefound() {
      console.log('New content is downloading.');
    },
    updated(registration) {
      console.log('New content is available; please refresh.');
      const confirmationResult = confirm(
          'Pieejams atjauninājums. Atjaunot lapu!'
      );
      if (confirmationResult) {
        registration.waiting.postMessage({action: 'skipWaiting'});
      }
    },
    offline() {
      console.log(
          'No internet connection found. App is running in offline mode.'
      );
    },
    error(error) {
      console.error('Error during service worker registration:', error);
    },
  });

  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', (e) => {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
}
