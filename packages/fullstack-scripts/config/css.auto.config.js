/**
 * Copyright (c) 2018, Maxim Andrews, MaximAndrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LOADERS = {
  sass: [ 'scss', 'sass' ],
  less: [ 'less' ]
};
const EXT = [ 'css' ];
const CWD = process.cwd();

const BROWSERSLIST = {
  browsers: [
    '>1%',
    'last 4 versions',
    'Firefox ESR',
    'not ie < 9', // React doesn't support IE8 anyway
  ]
};

let DEPENDENCIES = {};

/*
  The configuration here is somewhat confusing.
  "postcss" loader applies autoprefixer or nextcss to our CSS.
  "css" loader resolves paths in CSS and adds assets as dependencies.
  "style" loader normally turns CSS into JS modules injecting <style>.
  In development "style" loader enables hot editing of CSS.
  In production configuration, we do something different.
  `MiniCssExtractPlugin` first applies the "postcss" and "css" loaders
  (second argument), then grabs the result CSS and puts it into a
  separate file in our build process. This way we actually ship
  a single CSS file in production instead of JS code injecting <style>
  tags. If you use code splitting, however, any async bundles will still
  use the "style" loader inside the async code so CSS from them won't be
  in the main CSS file.
*/

class CSSAutoConfig {
  constructor (pkg) {
    this.pkg = pkg;
    this.deps = CSSAutoConfig.getDependencies(pkg);
  }

  static getDependencies (pkg) {
    return Object.assign(
      {},
      pkg.dependencies || {},
      pkg.devDependencies || {},
      pkg.peerDependencies || {},
      pkg.optionalDependencies || {}
    );
  }

  static getBrowsersList (pkg) {
    if (!pkg.browserslist) {
      return BROWSERSLIST;
    }

    return {
      browsers: pkg.browserslist[process.env.NODE_ENV] || pkg.browserslist
    };
  }

  static pkgFolderExists (pkgName) {
    let exists = true;

    try {
      fs.accessSync(path.join(CWD, 'node_modules', pkgName));
    } catch (e) {
      exists = false;
    }

    return exists;
  }

  moduleInstalled (pkgName) {
    const depExists = Boolean(this.deps[pkgName]);
    const folderExists = CSSAutoConfig.pkgFolderExists(pkgName);

    return depExists && folderExists;
  }

  installedLoaders () {
    return Object.keys(LOADERS).reduce((loaders, loaderName) => {
      if (this.moduleInstalled(`${ loaderName }-loader`)) {
        loaders.push(loaderName);
      }

      return loaders;
    }, []);
  }

  setupPostCSS () {
    const plugins = [ require('postcss-flexbugs-fixes') ];

    if (this.moduleInstalled('postcss-preset-env')) {
      plugins.push(require('postcss-preset-env')(Object.assign(
        {
          stage: 3,
          features: { 'nesting-rules': true },
          autoprefixer: {
            flexbox: 'no-2009'
          }
        },
        CSSAutoConfig.getBrowsersList(this.pkg)
      )));
    } else if (this.moduleInstalled('autoprefixer')) {
      plugins.push(require('autoprefixer')(Object.assign(
        { flexbox: 'no-2009' },
        CSSAutoConfig.getBrowsersList(this.pkg)
      )));
    }

    return {
      loader: require.resolve('postcss-loader'),
      options: {
        // produce sourcemap only in development mode for debugging
        // sourceMap: process.env.NODE_ENV === 'development',
        // Necessary for external CSS imports to work
        // https://github.com/facebookincubator/create-react-app/issues/2677
        ident: 'postcss',
        plugins,
      },
    };
  }

  static cssLoaderConfig (importLoaders) {
    return {
      loader: require.resolve('css-loader'),
      options: {
        importLoaders,
        camelCase: true,
        modules: true,
        localIdentName: process.env.NODE_ENV === 'production' ? '[hash:base64:5]' : '[name]-[local]',
        minimize: process.env.NODE_ENV === 'production',
        // sourceMap: process.env.NODE_ENV === 'development'
      },
    }
  }

  cssConfig () {
    const loaders = this.installedLoaders() || [];
    const extensions = loaders.reduce((exts, loader) => exts.concat(LOADERS[loader]), EXT);
    const useLoaders = [
      process.env.NODE_ENV !== 'production' ? require.resolve('style-loader') : require('mini-css-extract-plugin').loader
    ];

    useLoaders.push(CSSAutoConfig.cssLoaderConfig(loaders.length + 1));
    useLoaders.push(this.setupPostCSS());

    loaders.forEach(loaderName => useLoaders.push(require.resolve(`${ loaderName }-loader`)));

    return {
      test: new RegExp(`\\.(${ extensions.join('|') })$`),
      use: useLoaders
    }
  }
}

module.exports = pkg => new CSSAutoConfig(pkg);
