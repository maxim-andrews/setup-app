'use strict';

const { SSRRoutes } = require('setup-app-ssr');

exports = module.exports = SSRRoutes([
  // naming convention is important
  // server reloads on *.backend.js files change
  'src/Components/ServerFetch/ServerFetch.backend'
]);
