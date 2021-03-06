/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackKoaServer = require('webpack-koa-server');

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
const getClientEnvironment = require('../config/env');
const paths = require('../config/paths');
const pkgJsn = require(paths.appPackageJson);
// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_PATH%/xyz looks better than %PUBLIC_PATH%xyz.
const publicUrl = '';
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl);

const setupApp = pkgJsn.setupApp || {};
const csr = setupApp.csr !== false;
const ssr = typeof setupApp.ssr !== 'undefined';

// Current working directory
const CWD = process.cwd();

function getBackendMethod (backendType) {
  if (setupApp[backendType]) {
    try {
      const backendPath = require.resolve(path.join(CWD, setupApp[backendType]));
      const appBackend = require(backendPath);
      return  appBackend.default || appBackend;
    } catch (e) {
      console.log(e);
    }
  }

  return () => {};
}

const configs = [];
const csrConfig = csr ? require('../config/webpack.config.csr.dev') : false;
const ssrConfig = ssr ? require('../config/webpack.config.ssr.dev') : false;

// for server restart
const watchRestart = [];

if (ssr && setupApp.ssr.ssrMiddleware) {
  watchRestart.push(setupApp.ssr.ssrMiddleware);
}

if (typeof setupApp.backendBefore === 'string') {
  watchRestart.push(setupApp.backendBefore);
}

if (typeof setupApp.backendAfter === 'string') {
  watchRestart.push(setupApp.backendAfter);
}

if (typeof setupApp.watchBackendFiles === 'string') {
  setupApp.watchBackendFiles = [ setupApp.watchBackendFiles ];
}

if (Array.isArray(setupApp.watchBackendFiles)) {
  setupApp.watchBackendFiles.forEach(file => {
    if (typeof file === 'string') {
      watchRestart.push(file);
    }
  });
}

const webpackKoaServer = new WebpackKoaServer({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  appName: pkgJsn.name,
  template: paths.appHtml,
  env: env.raw,
  ssl: false,
  protocol: 'http',
  content: paths.appPublic,
  watchRestart,
  backendBefore: getBackendMethod('backendBefore'),
  backendAfter: getBackendMethod('backendAfter')
});

if (csr) {
  configs.push(csrConfig(webpackKoaServer));
}

if (ssr) {
  configs.push(ssrConfig(webpackKoaServer));
}

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    'If this was unintentional, check that you haven\'t mistakenly set it in your shell.'
  );
  console.log(`Learn more here: ${chalk.yellow('http://bit.ly/2mwWSwH')}`);
  console.log();
}

// "Compiler" is a low-level interface to Webpack.
// It lets us listen to some events and provide our own custom messages.
try {
  const compiler = webpack(configs);

  process.nextTick(() => {
    compiler.watch({
      ignored: /node_modules/
    }, () => {});
  });
} catch (err) {
  console.log(chalk.red('Failed to compile.'));
  console.log();
  console.log(err);
  console.log();
  process.exit(1);
}
