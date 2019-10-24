/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const webpack = require('webpack');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');

const paths = require('../config/paths');
const pkgJsn = require(paths.appPackageJson);

const setupApp = pkgJsn.setupApp || {};
const csr = setupApp.csr !== false;
const ssr = typeof setupApp.ssr !== 'undefined';

const prodCsrConfig = csr ? require('../config/webpack.config.csr.prod')({ csr, ssr }) : false;
const prodSsrConfig = ssr ? require('../config/webpack.config.ssr.prod')({ csr, ssr }) : false;

const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const requiredFiles = [paths.appHtml];

if (csr) {
  requiredFiles.push(paths.appIndexJs);
}

// Warn and crash if required files are missing
if (!checkRequiredFiles(requiredFiles)) {
  process.exit(1);
}

(async () => {
  const builds = [];
  const previousFileSizes = {};

  // First, read the current file sizes in build directory.
  // This lets us display how much they changed later.
  if (csr) {
    previousFileSizes.csr = await measureFileSizesBeforeBuild(paths.appBuild);
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);
  }


  if (ssr) {
    const buildFolder = csr ? paths.appBuildServer : path.dirname(paths.appBuildServer);
    previousFileSizes.ssr = await measureFileSizesBeforeBuild(buildFolder);
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(buildFolder);
  }

  if (csr) {
    builds.push(buildClientSide(previousFileSizes.csr));
  }

  if (ssr) {
    builds.push(buildServerSide(previousFileSizes.ssr));
  }

  Promise.all(builds)
    .then(results => {
      const warnings = results.reduce(
        (warnings, result) => warnings.concat(result.warnings), []
      );

      if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'));
        console.log(warnings.join('\n\n'));
        console.log(
          '\nSearch for the ' +
            chalk.underline(chalk.yellow('keywords')) +
            ' to learn more about each warning.'
        );
        console.log(
          'To ignore, add ' +
            chalk.cyan('// eslint-disable-next-line') +
            ' to the line before.\n'
        );
      } else {
        console.log(chalk.green('Compiled successfully.\n'));
      }

      results.forEach(res => {
        console.log('File sizes after gzip:\n');
        printFileSizesAfterBuild(
          res.stats,
          res.previousFileSizes,
          res.outputFolder,
          WARN_AFTER_BUNDLE_GZIP_SIZE,
          WARN_AFTER_CHUNK_GZIP_SIZE
        );
        console.log();
      });
    },
    err => {
      console.log(chalk.red('Failed to compile.\n'));
      printBuildError(err);
      process.exit(1);
    });
})();

function buildClientSide (previousFileSizes) {
  // Merge with the public folder
  copyPublicFolder();
  // Start the webpack build
  return build(prodCsrConfig, 'client side').then(res => {
    if (ssr) {
      const assets = Object.keys(res.stats.compilation.assets);
      const htmlFile = assets.filter(file => /\.html$/.test(file)).shift();

      if (htmlFile) {
        const oldTplPath = path.join(paths.appBuild, htmlFile);
        const newTplPath = path.join(paths.appBuildServer, htmlFile);

        if (!fs.existsSync(paths.appBuildServer)) {
          fs.mkdirSync(paths.appBuildServer);
        }

        fs.renameSync(oldTplPath, newTplPath);
      }
    }

    res.previousFileSizes = previousFileSizes;
    res.outputFolder = paths.appBuild;
    return res;
  });
}

function buildServerSide (previousFileSizes) {
  const buildFolder = csr ? paths.appBuildServer : path.dirname(paths.appBuildServer);

  if (!csr) {
    // Merge with the public folder
    copyPublicFolder();
  }

  // Start the webpack build
  return build(prodSsrConfig, 'server side').then(res => {
    const dir2Move = path.join(paths.appBuildServer, 'static');
    const assets = Object.keys(res.stats.compilation.assets);

    if (csr) {
      res.stats.compilation.assets = assets.reduce((assetObj, asset) => {
        if (!asset.match(/^static/i)) {
          assetObj[asset] = res.stats.compilation.assets[asset];
        }

        return assetObj;
      }, {});

      fs.emptyDirSync(dir2Move);
      fs.rmdirSync(dir2Move);
    } else {
      const csrDir = path.basename(paths.appBuild);
      const ssrDir = path.basename(paths.appBuildServer);

      res.stats.compilation.assets = assets.reduce((assetObj, asset) => {
        const path2Add = asset.match(/^static/i) ? csrDir : ssrDir;
        const newAssetPath = path.join(path2Add, asset);

        assetObj[newAssetPath] = res.stats.compilation.assets[asset];

        return assetObj;
      }, {});

      const newAssetsDir = path.join(paths.appBuild, 'static');
      if (!fs.existsSync(paths.appBuild)) {
        fs.mkdirSync(paths.appBuild);
      }

      fs.renameSync(dir2Move, newAssetsDir);
    }

    res.previousFileSizes = previousFileSizes;
    res.outputFolder = buildFolder;
    return res;
  });
}

// Create the production build and print the deployment instructions.
function build(config, buildType) {
  console.log(`Creating an optimized ${buildType} production build...`);

  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }
      const messages = formatWebpackMessages(stats.toJson({}, true));
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n'
          )
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }

      return resolve({
        stats,
        warnings: messages.warnings,
      });
    });
  });
}

function copyPublicFolder() {
  if (!fs.existsSync(paths.appBuild)) {
    fs.mkdirSync(paths.appBuild);
  }

  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml,
  });
}
