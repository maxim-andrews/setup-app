'use strict';

const fs = require('fs');
const path = require('path');

const pkgJsn = require(require.resolve(path.join(process.cwd(), 'package.json')));
const ssrCfg = pkgJsn.serverSideRendering || {};
const ssrBase = path.resolve(ssrCfg.buildPath);

const defaultIndex = pkgJsn.defaultIndex || 'index.html';

exports = module.exports = (absolutePublicPath) => {
  const ssrFiles = fs.readdirSync(ssrBase, 'utf8');

  return {
    html: fs.readFileSync(path.resolve(path.join(absolutePublicPath, defaultIndex)), 'utf8'),
    methods: ssrFiles.filter(file => /\.js$/.test(file))
      .reduce( (allMethods, file) => {
        const method = require(require.resolve(path.join(ssrBase, file)));
        allMethods[file.replace(/\.js$/, '')] = method.default || method;
        return allMethods;
      }, {})
  };
};
