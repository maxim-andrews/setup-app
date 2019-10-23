// Use DefinePlugin (Webpack) or loose-envify (Browserify)
// together with Uglify to strip the dev branch in prod build.
if (process.env.SSR === true) {
  exports = module.exports = require('./CreateReducers.ssr');
} else {
  exports = module.exports = require('./CreateReducers.csr');
}
