const HtmlWebpackPlugin = require('html-webpack-plugin');

class HtmlWebpackExcludeJsPlugin {
  apply (compiler) {
    compiler.hooks.compilation.tap('HtmlWebpackExcludeJsPlugin', compilation => {
      // Static Plugin interface |compilation |HOOK NAME | register listener
      HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(
        'HtmlWebpackExcludeJsPlugin', // <-- Set a meaningful name here for stacktraces
        (data, cb) => {
          // Manipulate the content
          data.assets.js = [];
          // Tell webpack to move on
          cb(null, data);
        }
      );
    });
  }
}

module.exports = HtmlWebpackExcludeJsPlugin;
