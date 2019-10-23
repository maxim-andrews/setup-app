'use strict';

const { SSRRoutes } = require('setup-app-ssr');

// kra-mod-start
if (KRA.CSR) {
  exports = module.exports = SSRRoutes([
    // naming convention is important
    // server reloads on *.backend.js files change
    'src/Components/ServerFetch/ServerFetch.backend'
  ]);
} else if (KRA.SSR && KRA.REDUX) {
  exports = module.exports = SSRRoutes([
    // naming convention is important
    // server reloads on *.backend.js files change
    'src/Components/ServerFetch/ServerFetch.backend',
    'src/Components/SpinLogo/SpinLogo.backend'
  ]);
}
// kra-mod-end
