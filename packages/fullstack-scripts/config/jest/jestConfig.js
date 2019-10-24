/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const chalk = require('chalk');
const paths = require('../paths');

module.exports = (resolve, rootDir, isEjecting) => {
  const setupTestsMatches = paths.testsSetup.match(/src[/\\]setupTests\.(.+)/);
  const setupTestsFileExtension =
    (setupTestsMatches && setupTestsMatches[1]) || 'js';
  const setupTestsFile = fs.existsSync(paths.testsSetup)
    ? `<rootDir>/src/setupTests.${setupTestsFileExtension}`
    : undefined;

  const config = {
    collectCoverageFrom: ['src/**/*.{js,jsx}'],
    resolver: require.resolve('jest-pnp-resolver'),
    setupFiles: [ require.resolve('react-app-polyfill/jsdom') ],
    setupTestFrameworkScriptFile: setupTestsFile,
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
      '<rootDir>/src/**/?(*.)(spec|test).{js,jsx}',
    ],
    testEnvironment: 'jsdom',
    testURL: 'http://localhost',
    transform: {
      '^.+\\.(js|jsx)$': resolve('config/jest/babelTransform.js'),
      '^.+\\.css$': resolve('config/jest/cssTransform.js'),
      '^(?!.*\\.(js|jsx|css|json)$)': resolve('config/jest/fileTransform.js'),
    },
    transformIgnorePatterns: [
      '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$',
      '^.+\\.module\\.(css|sass|scss)$',
    ],
    moduleNameMapper: {
      '^react-native$': 'react-native-web',
      '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    },
    moduleFileExtensions: [...paths.moduleFileExtensions, 'node'].filter(
      ext => !ext.includes('mjs')
    )
  };
  if (rootDir) {
    config.rootDir = rootDir;
  }
  const overrides = Object.assign({}, require(paths.appPackageJson).jest);
  const supportedKeys = [
    'collectCoverageFrom',
    'coverageReporters',
    'coverageThreshold',
    'globalSetup',
    'globalTeardown',
    'resetMocks',
    'resetModules',
    'snapshotSerializers',
    'watchPathIgnorePatterns',
  ];
  if (overrides) {
    supportedKeys.forEach(key => {
      if (overrides.hasOwnProperty(key)) {
        config[key] = overrides[key];
        delete overrides[key];
      }
    });
    const unsupportedKeys = Object.keys(overrides);
    if (unsupportedKeys.length) {
      const isOverridingSetupFile =
        unsupportedKeys.indexOf('setupTestFrameworkScriptFile') > -1;

      if (isOverridingSetupFile) {
        console.error(
          chalk.red(
            'We detected ' +
              chalk.bold('setupTestFrameworkScriptFile') +
              ' in your package.json.\n\n' +
              'Remove it from Jest configuration, and put the initialization code in ' +
              chalk.bold('src/setupTests.js') +
              '.\nThis file will be loaded automatically.\n'
          )
        );
      } else {
        console.error(
          chalk.red(
            '\nOut of the box, Setup App supports overriding only ' +
              'these Jest options:\n\n' +
              supportedKeys
                .map(key => chalk.bold('  \u2022 ' + key))
                .join('\n') +
              '.\n\n' +
              'These options in your package.json Jest configuration ' +
              'are not currently supported by Setup App:\n\n' +
              unsupportedKeys
                .map(key => chalk.bold('  \u2022 ' + key))
                .join('\n') +
              '\n\nIf you wish to override other Jest options, you need to ' +
              'file an issue with Setup App Suite to discuss ' +
              'supporting more options out of the box.\n'
          )
        );
      }

      process.exit(1);
    }
  }
  return config;
};
