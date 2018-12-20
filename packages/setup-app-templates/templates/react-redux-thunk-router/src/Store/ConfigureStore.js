// Use DefinePlugin (Webpack) or loose-envify (Browserify)
// together with Uglify to strip the dev branch in prod build.
if (process.env.NODE_ENV === 'production') { // eslint-disable-line no-undef
  module.exports = require('./ConfigureStore.prod');
} else { // eslint-disable-line no-undef
  module.exports = require('./ConfigureStore.dev');
}
