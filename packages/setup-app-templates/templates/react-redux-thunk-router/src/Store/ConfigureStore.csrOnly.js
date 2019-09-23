// Use DefinePlugin (Webpack) or loose-envify (Browserify)
// together with Uglify to strip the dev branch in prod build.
let configureStore;


if (process.env.NODE_ENV === 'production') {
  // kra-mod-start
  if (KRA.CSR) {
    configureStore = require('./ConfigureStore.csr.prod');  // kra-mod-replace .csr
  }
  // kra-mod-end
} else {
  // kra-mod-start
  if (KRA.CSR) {
    configureStore = require('./ConfigureStore.csr.dev'); // kra-mod-replace .csr
  }
  // kra-mod-end
}

exports = module.exports = configureStore;
