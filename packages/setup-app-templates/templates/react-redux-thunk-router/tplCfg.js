'use strict';

const { copyPkgJsnProps } = require('../../lib/helpers');
const pkgJsnCfg = require('./pkgJsnCnf');

function entryFiles (KRAVARS) {
  const files = [];

  files.push( './src/index.js' );
  files.push( './server/index.js' );
  files.push( './public/favicon.ico' );
  files.push( './public/index.html' );
  files.push( './public/manifest.json' );
  files.push( './.gitignore' );
  files.push( './README.md' );

  if (KRAVARS.SSR) {
    files.push( './src/server.side.renderer.js' );
  }

  if (KRAVARS.BACKEND) {
    files.push( './src/Components/ServerFetch/ServerFetch.backend.js' );
  }

  return files;
}

const copyProps = [
  'scripts',
  'eslintConfig',
  'browserslist',
  'serviceWorkerPreCache'
];

function pkgJsn (PKGVARS, KRAVARS) {
  const pkgTpl = require('./package.json');
  const pkgOut = {
    name: PKGVARS.name,
    version: '0.0.1',
    private: true,
    description: PKGVARS.description,
    author: PKGVARS.author,
    license: PKGVARS.license,
    devDependencies: {},
    dependencies: {}
  };

  copyProps.forEach(prop => {
    if (pkgTpl[prop]) {
      pkgOut[prop] = pkgTpl[prop];
    }
  });

  pkgJsnCfg.forEach(cfgObj => {
    if (!cfgObj.test(KRAVARS)) {
      return;
    }

    copyPkgJsnProps(pkgTpl, pkgOut, cfgObj.cfg);
  });

  return pkgOut;
}

exports = module.exports = {
  name: 'React',
  rootDir: __dirname,
  questions: require('./questions'),
  entryFiles: entryFiles,
  pkgJsn
};
