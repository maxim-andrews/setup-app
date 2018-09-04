/**
 * Copyright (c) 2018, Maxim Andrews, MaximAndrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const proxy = require('koa-proxy');
const serveStatic = require('koa-static');
const ignoredFiles = require('react-dev-utils/ignoredFiles');
const noopServiceWorkerMiddleware = require('noop-service-worker-middleware');
const config = require('./webpack.config.dev');
const paths = require('./paths');

const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const host = process.env.HOST || '0.0.0.0';

const appSrc = (paths.appSrc || fs.realpathSync(path.join(__dirname, '..', 'src')));
const serverPath = path.join(appSrc, 'server.js');

let serverRouter;

try {
  serverRouter = require(serverPath);
} catch (e) {
  serverRouter = false;
}

module.exports = function(port, compiler, proxyConfig) {
  return {
    compiler,
    // By default WebpackServe copies server URI to clipboard when server is started.
    // We want to prevent this feature to avoid any potential clipboard data erased.
    clipboard: false,
    // Silence WebpackServe's own logs since they're generally not useful.
    // It will still show compile warnings and errors with this setting.
    logLevel: 'silent',
    // By default WebpackServe serves physical files from current directory
    // in addition to all the virtual build products that it serves from memory.
    // This is confusing because those files won’t automatically be available in
    // production build folder unless we copy them. However, copying the whole
    // project directory is dangerous because we may expose sensitive files.
    // Instead, we establish a convention that only files in `public` directory
    // get served. Our build script will copy `public` into the `build` folder.
    // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
    // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
    // Note that we only recommend to use `public` folder as an escape hatch
    // for files like `favicon.ico`, `manifest.json`, and libraries that are
    // for some reason broken when imported through Webpack. If you just want to
    // use an image, put it in `src` and `import` it from JavaScript instead.
    // content: paths.appPublic,
    // Hot reloading server enabled by default.
    // An object containing options for webpack-hot-client
    hotClient: false,
    // An object containing options for webpack-dev-middleware
    devMiddleware: {
      // It is important to tell WebpackDevServer to use the same "root" path
      // as we specified in the config. In development, we always serve from /.
      publicPath: config.output.publicPath,
      // WebpackDevMiddleware is noisy by default so we emit custom message instead
      // by listening to the compiler events with `compiler.plugin` calls above.
      logLevel: 'silent',
      stats: 'errors-only',
      // Reportedly, this avoids CPU overload on some systems.
      // https://github.com/facebookincubator/create-react-app/issues/293
      // src/node_modules is not ignored to support absolute imports
      // https://github.com/facebookincubator/create-react-app/issues/1065
      watchOptions: {
        ignored: ignoredFiles(paths.appSrc),
      },
      index: path.basename(paths.appHtml)
    },
    // Enable HTTPS if the HTTPS environment variable is set to 'true'
    https: protocol === 'https' ? {
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH), // Private keys in PEM format.
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH), // Cert chains in PEM format.
      pfx: process.env.HTTPS_PFX, // PFX or PKCS12 encoded private key and certificate chain.
      passphrase: process.env.HTTPS_PASSPHRASE // A shared passphrase used for a single private key and/or a PFX.
    } : null,
    host,
    port,
    add(app, middleware) {
      // if we have backend then we add proxy and historyApiFallback to router instead of paths.
      const proxyRouter = serverRouter || app;

      // if backend router exists we should added it
      if (serverRouter) {
        app.use(proxyRouter.routes());
        app.use(proxyRouter.allowedMethods());
      }

      // This service worker file is effectively a 'no-op' that will reset any
      // previous service worker registered for the same host:port combination.
      // We do this in development to avoid hitting the production cache if
      // it used the same host and port.
      // https://github.com/facebookincubator/create-react-app/issues/2272#issuecomment-302832432
      app.use(noopServiceWorkerMiddleware());

      // serving custom static as default webpack-serve option doesn't work well
      app.use(serveStatic(paths.appPublic, { defer: true }));

      if (proxyConfig) {
        // Enable proxy server for different requests
        proxyRouter.use(proxy(proxyConfig));
      }

      // since we're manipulating the order of middleware added, we need to handle
      // adding these two internal middleware functions.
      middleware.webpack();
      middleware.content();
    },
  };
};
