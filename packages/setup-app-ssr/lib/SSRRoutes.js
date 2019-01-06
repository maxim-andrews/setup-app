'use strict';

const path = require('path');

const CWD = process.cwd();

exports = module.exports = appModules => {
  if (!Array.isArray(appModules) || appModules.length === 0) {
    throw Error('SSRRoutes first argument should be an array'
      + ' of strings of paths to your backend modules'
      + ' with at least one route');
  }

  return app => {
    appModules.forEach(modulePath => {
      try {
        // dynamic "requires" to properly run hot reloads
        // in development mode of your app using setup-app-suite
        const filePath = require.resolve(path.join(CWD, modulePath));
        delete require.cache[filePath];
        const routerObj = require(filePath);

        app.use(routerObj.routes(), routerObj.allowedMethods());
      } catch (e) {
        console.error(e);
        process.exit(0);
      }
    });
  };
};
