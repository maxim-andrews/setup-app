// Use DefinePlugin (Webpack) or loose-envify (Browserify)
// together with Uglify to strip the dev branch in prod build.
let configureStore;

if (process.env.SSR === true) {
  configureStore = require('./ConfigureStore.ssr');
} else {
  if (process.env.NODE_ENV === 'production') {
    configureStore = require('./ConfigureStore.csr.prod');
  } else {
    configureStore = require('./ConfigureStore.csr.dev');
  }
}

exports = module.exports = configureStore;
