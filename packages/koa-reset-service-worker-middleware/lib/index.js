'use strict';

module.exports = createKoaResetServiceWorkerMiddleware;

function createKoaResetServiceWorkerMiddleware(path = '/service-worker.js') {
  // eslint-disable-next-line consistent-return
  return async (ctx, next) => {
    if (ctx.path === path) {
      ctx.set("Content-Type", "text/javascript");
      ctx.body = `// This service worker file is effectively a 'no-op' that will reset any
// previous service worker registered for the same host:port combination.
// In the production build, this file is replaced with an actual service worker
// file that will precache your site's local assets.

window.addEventListener('install', () => window.skipWaiting());

window.addEventListener('activate', () => {
  window.clients.matchAll({ type: 'window' }).then(wClients => {
    for (let wClient of wClients) {
      // Force open pages to refresh, so that they have a chance to load the
      // fresh navigation response from the local dev server.
      wClient.navigate(wClient.url);
    }
  });
});
`;
    } else {
      await next();
    }
  };
};
