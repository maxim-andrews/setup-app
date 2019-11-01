/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const FrontServePlugin = require('front-serve-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');

const stylesAutoConfig = require('./styles.auto.config');
const getClientEnvironment = require('./env');
const paths = require('./paths');

const cfu = require('./config.utils');

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Webpack uses `publicPath` to determine where the app is being served from.
// In development, we always serve from the root. This makes config easier.
const publicPath = '/';
// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_PATH%/xyz looks better than %PUBLIC_PATH%xyz.
const publicUrl = '';
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl);
// parsed package.json file
const pkgJsn = require(paths.appPackageJson);

// Protocol to use
const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';

// Generate ssl configuration
const sslObj = protocol === 'https' ? Object.assign(
  {
    passphrase: process.env.HTTPS_PASSPHRASE // A shared passphrase used for a single private key and/or a PFX.
  },
  process.env.HTTPS_KEY_PATH && process.env.HTTPS_CERT_PATH ? {
    key: fs.readFileSync(process.env.HTTPS_KEY_PATH), // Private keys in PEM format.
    cert: fs.readFileSync(process.env.HTTPS_CERT_PATH), // Cert chains in PEM format.
  } : {},
  process.env.HTTPS_PFX ? {
    pfx: process.env.HTTPS_PFX, // PFX or PKCS12 encoded private key and certificate chain.
  } : {}
) : false;

// This is the development configuration.
// It is focused on developer experience and fast rebuilds.
// The production configuration is different and lives in a separate file.
module.exports = webpackKoaServer => {
  return {
    // Name of the configuration to identify errors and warnings
    name: 'csr-dev',
    // Should be configured in watch mode to have Hot Module Replacement
    watch: true,
    // We set mode in scripts/start.js
    mode: process.env.NODE_ENV,
    // You may want 'eval' instead if you prefer to see the compiled output in DevTools.
    // See the discussion in https://github.com/facebookincubator/create-react-app/issues/343.
    devtool: 'cheap-module-source-map',
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    // The first two entry points enable "hot" CSS and auto-refreshes for JS.
    entry: [ paths.appIndexJs ],
    output: {
      // Default path to extract files
      path: '/',
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: true,
      // This does not produce a real file. It's just the virtual path that is
      // served by WebpackDevServer in development. This is the JS bundle
      // containing code from all our entry points, and the Webpack runtime.
      filename: 'static/js/bundle.js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: 'static/js/[name].chunk.js',
      // This is the URL that app is served from. We use "/" in development.
      publicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: info =>
        path
          .resolve(info.absoluteResourcePath)
          .replace(/\\/g, '/'),
    },
    optimization: {
      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      splitChunks: {
        chunks: 'all',
        name: false,
      },
      // Keep the runtime chunk seperated to enable long term caching
      // https://twitter.com/wSokra/status/969679223278505985
      runtimeChunk: true,
    },
    resolve: {
      alias: {
        // There should be only one react and react-dom copy as it causes issue with hooks
        // https://fb.me/react-invalid-hook-call
        react: cfu.relsoveModule('react'),
        'react-dom': cfu.relsoveModule('react-dom'),
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
      },
      // This allows you to set a fallback for where Webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebookincubator/create-react-app/issues/253
      modules: [ paths.appNodeModules ],
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebookincubator/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: paths.moduleFileExtensions.map(ext => `.${ext}`),
      plugins: [
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
      ],
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },

        // First, run the linter.
        // It's important to do this before Babel processes the JS.
        {
          test: /\.(js|mjs|jsx)$/,
          enforce: 'pre',
          use: [
            {
              options: {
                formatter: require.resolve('react-dev-utils/eslintFormatter'),
                eslintPath: require.resolve('eslint'),
                baseConfig: {
                  extends: [require.resolve('eslint-config-setup-app')],
                },
                ignore: false,
                useEslintrc: false,
              },
              loader: require.resolve('eslint-loader'),
            },
          ],
          include: paths.appSrc,
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: 1000,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            // Process JS with Babel.
            {
              test: /\.(js|mjs|jsx)$/,
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve(
                  'babel-preset-react-app/webpack-overrides'
                ),
                babelrc: false,
                configFile: false,
                presets: [[require.resolve('@babel/preset-react'), { development: process.env.NODE_ENV === 'development' }]],
                // Make sure we have a unique cache identifier, erring on the
                // side of caution.
                cacheIdentifier: getCacheIdentifier('development', [
                  '@babel/plugin-proposal-object-rest-spread',
                  'babel-plugin-named-asset-import',
                  'fullstack-scripts',
                  'react-dev-utils',
                ]),
                plugins: [
                  require.resolve('@babel/plugin-proposal-object-rest-spread'),
                  [
                    require.resolve('babel-plugin-named-asset-import'),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent: '@svgr/webpack?-prettier,-svgo![path]',
                        },
                      },
                    }
                  ]
                ],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                // Don't waste time on Gzipping the cache
                cacheCompression: false
              },
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [
                    require.resolve('babel-preset-react-app/dependencies'),
                    { helpers: true },
                  ],
                ],
                cacheDirectory: true,
                // Don't waste time on Gzipping the cache
                cacheCompression: false,
                cacheIdentifier: getCacheIdentifier('development', [
                  '@babel/plugin-proposal-object-rest-spread',
                  'babel-plugin-named-asset-import',
                  'fullstack-scripts',
                  'react-dev-utils',
                ]),
                // If an error happens in a package, it's possible to be
                // because it was compiled. Thus, we don't want the browser
                // debugger to show the original code. Instead, the code
                // being evaluated would be much more helpful.
                sourceMaps: false,
              },
            }
          ].concat(
          // Configure css styles according to a current mode, i.e. 'developement' or 'production'
            stylesAutoConfig(pkgJsn).styleRules(),
            [
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
              {
                loader: require.resolve('file-loader'),
                // Exclude `js` files to keep "css" loader working as it injects
                // its runtime that would otherwise processed through "file" loader.
                // Also exclude `html` and `json` extensions so they get processed
                // by webpacks internal loaders.
                exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
                options: {
                  name: 'static/media/[name].[hash:8].[ext]',
                },
              },
            ]
          ),
        },
        // ** STOP ** Are you adding a new loader?
        // Make sure to add the new loader(s) before the "file" loader.
      ],
    },
    plugins: [
      // Serving frontend files
      new FrontServePlugin({
        server: webpackKoaServer,
        appName: pkgJsn.name,
        template: paths.appHtml,
        env: env.raw,
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT, 10) || 3000,
        ssl: sslObj,
        content: paths.appPublic,
        defaultIndex: path.basename(paths.appHtml)
      }),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'development') { ... }. See `./env.js`.
      new webpack.DefinePlugin(Object.assign(env.stringified, {
        'process.env.SSR': false
      })),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebookincubator/create-react-app/issues/240
      new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebookincubator/create-react-app/issues/186
      new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so that tools can pick it up without
      // having to parse `index.html`.
      new ManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath,
      }),
    ],
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
    target: 'web',
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: false,
  };
};
