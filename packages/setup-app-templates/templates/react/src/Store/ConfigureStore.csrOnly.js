// Use DefinePlugin (Webpack) or loose-envify (Browserify)
// together with Uglify to strip the dev branch in prod build.
let configureStore;

if (process.env.NODE_ENV === 'production') {
  configureStore = require('./ConfigureStore.csr.prod');  // kra-mod-replace .csr
} else {
  configureStore = require('./ConfigureStore.csr.dev'); // kra-mod-replace .csr
}

exports = module.exports = configureStore;
