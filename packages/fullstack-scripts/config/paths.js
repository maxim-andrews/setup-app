/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const appPkgJsn = require(resolveApp('package.json'));
const setupApp = appPkgJsn.setupApp || {};
const CSR = typeof setupApp.csr === 'object' && setupApp.csr !== null;
const clientCfg = (typeof setupApp.csr === 'object' && setupApp.csr !== null
  && setupApp.csr) || {};
const envPublicUrl = process.env.PUBLIC_URL;

function ensureSlash(path, needsSlash) {
  const hasSlash = path.endsWith('/');
  if (hasSlash && !needsSlash) {
    return path.substring(0, path.length - 1);
  } else if (!hasSlash && needsSlash) {
    return `${ path }/`;
  } else {
    return path;
  }
}

const getPublicUrl = appPkgJsn =>
  envPublicUrl || appPkgJsn.homepage;

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
function getServedPath(appPkgJsn) {
  const publicUrl = getPublicUrl(appPkgJsn);
  const servedUrl =
    envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : '/');
  return ensureSlash(servedUrl, true);
}

const resolveOwn = relativePath => path.resolve(__dirname, '..', relativePath);

// we're in ./node_modules/fullstack-scripts/config/
const paths = {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appBuild: resolveApp(clientCfg.buildPath || 'build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  yarnLockFile: resolveApp('yarn.lock'),
  testsSetup: resolveApp('src/setupTests.js'),
  appNodeModules: resolveApp('node_modules'),
  publicUrl: getPublicUrl(appPkgJsn),
  servedPath: getServedPath(appPkgJsn),
  ownPath: resolveOwn('.'),
  ownNodeModules: resolveOwn('node_modules'), // This is empty on npm 3
  moduleFileExtensions: ['web.mjs', 'mjs', 'web.js', 'js', 'json', 'web.jsx', 'jsx']
};

if (CSR) {
  paths.appIndexJs = resolveApp('src/index.js');
}

if (setupApp.ssr) {
  const ssrCfg = setupApp.ssr;

  paths.ssrTemplate = paths.appHtml || resolveApp(ssrCfg.htmlTemplate || 'public/index.html');
  paths.ssrMiddleware = resolveApp(ssrCfg.ssrMiddleware || 'server/ssrMiddleware.js');
  paths.appBuild = resolveApp(clientCfg.buildPath || 'build/client');
  paths.appBuildServer = resolveApp(ssrCfg.buildPath || 'build/server');

  paths.ssrMethods = typeof ssrCfg.methods === 'object'
    && ssrCfg.methods !== null
    && Object.keys(ssrCfg.methods).length
    ? Object.keys(ssrCfg.methods).reduce(
      (allMethods, method) => {
        allMethods[method] = resolveApp(ssrCfg.methods[method]);
        return allMethods;
      },
      {}
    ) : {};
}

module.exports = paths;
