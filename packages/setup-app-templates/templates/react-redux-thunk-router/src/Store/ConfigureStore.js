// Use DefinePlugin (Webpack) or loose-envify (Browserify)
// together with Uglify to strip the dev branch in prod build.
let configureStore;

if (process.env.SSR === true) {
  if (process.env.NODE_ENV === 'production') {
    configureStore = require('./ConfigureStore.ssr.prod');
  } else {
    configureStore = require('./ConfigureStore.ssr.dev');
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    configureStore = require('./ConfigureStore.prod');
  } else {
    configureStore = require('./ConfigureStore.dev');
  }
}

exports = module.exports = configureStore;
