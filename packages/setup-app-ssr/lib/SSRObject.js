'use strict';

const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const pkgJsn = require(path.join(CWD, 'package.json'));
const setupApp = pkgJsn.setupApp || {};

const csrCfg = setupApp.csr || { buildPath: 'build/client' };
const clientBase = path.resolve(path.join(CWD, csrCfg.buildPath));
const ssrCfg = setupApp.ssr || { buildPath: 'build/server' };
const ssrBase = path.resolve(path.join(CWD, ssrCfg.buildPath));
const defaultIndex = setupApp.defaultIndex || 'index.html';

exports = module.exports = () => {
  const ssrFiles = fs.readdirSync(ssrBase, 'utf8');

  return {
    html: fs.readFileSync(path.join(clientBase, defaultIndex), 'utf8'),
    methods: ssrFiles.filter(file => /\.js$/.test(file))
      .reduce( (allMethods, file) => {
        const method = require(require.resolve(path.join(ssrBase, file)));
        allMethods[file.replace(/\.js$/, '')] = method.default || method;
        return allMethods;
      }, {})
  };
};
