/**
 * Copyright (c) 2018, Maxim Andrews, MaximAndrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const cfu = require('./config.utils');
const getLocalIdent = cfu.getLocalIdent;

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

class StylesAutoConfig {
  constructor (pkg) {
    this.pkg = pkg;
    this.deps = StylesAutoConfig.getDependencies(pkg);
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
    const folderExists = StylesAutoConfig.pkgFolderExists(pkgName);

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

  setupPostCSS (nested = false) {
    const plugins = [ require('postcss-flexbugs-fixes') ];

    if (this.moduleInstalled('postcss-preset-env')) {
      plugins.push(require('postcss-preset-env')(Object.assign(
        {
          stage: 3,
          autoprefixer: {
            flexbox: 'no-2009'
          }
        },
        nested ? { features: { 'nesting-rules': true } } : {},
        StylesAutoConfig.getBrowsersList(this.pkg)
      )));
    } else if (this.moduleInstalled('autoprefixer')) {
      plugins.push(require('autoprefixer')(Object.assign(
        { flexbox: 'no-2009' },
        StylesAutoConfig.getBrowsersList(this.pkg)
      )));
    }

    return {
      loader: require.resolve('postcss-loader'),
      options: {
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
        localsConvention: 'camelCase',
        modules: process.env.NODE_ENV !== 'production'
          ? { localIdentName: '[name]-[local]' }
          : { getLocalIdent }
      },
    };
  }

  loaderConfig (loaderName, extensions, ssr, postcss) {
    const useLoaders = [
      process.env.NODE_ENV !== 'production' && !ssr
        ? require.resolve('style-loader')
        : require('mini-css-extract-plugin').loader
    ];

    useLoaders.push(StylesAutoConfig.cssLoaderConfig(postcss ? 1 : 2));
    useLoaders.push(this.setupPostCSS(postcss));

    if (!postcss) {
      useLoaders.push(cfu.relsoveModule(`${ loaderName }-loader`));
    }

    return {
      test: Array.isArray(extensions)
        ? ( extensions.length > 1
          ? new RegExp(`\\.(${ extensions.join('|') })$`)
          : new RegExp(`\\.${ extensions.join('') }$`)
          )
        : new RegExp(`\\.${ extensions }$`),
      use: useLoaders
    };
  }

  styleRules (ssr) {
    const loaders = this.installedLoaders() || [];

    return [
      this.loaderConfig('css', 'css', ssr, true)
    ].concat(
      loaders.map(
        loader => this.loaderConfig(loader, LOADERS[loader], ssr)
      )
    );
  }
}

module.exports = pkg => new StylesAutoConfig(pkg);
