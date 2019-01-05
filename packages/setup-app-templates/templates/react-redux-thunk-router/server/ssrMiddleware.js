'use strict';

const { SSRMiddleware } = require('setup-app-ssr');

exports = module.exports = SSRMiddleware({
  initStore: 'initStore',
  configureStore: 'configureStore',
  contentMethods: {
    main: {
      match: '<div id="root"></div>',
      replacement: '<div id="root">#@#output#@#</div>'
    }
  }
});
