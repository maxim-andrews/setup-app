'use strict';

const path = require('path');
const pathToRegExp = require('path-to-regexp');

const CWD = process.cwd();

exports = module.exports = appModules => {
  if (!Array.isArray(appModules) || appModules.length === 0) {
    throw Error('SSRRoutes first argument should be array'
      + ' of strings of paths to your backend modules'
      + ' with at least one route');
  }

  return app => {
    const pathRegExps = [];

    appModules.forEach(modulePath => {
      try {
        // dynamic "requires" to properly run hot reloads
        // in development mode of your app using setup-app-suite
        const filePath = require.resolve(path.join(CWD, modulePath));
        delete require.cache[filePath];
        const routerObj = require(filePath);

        app.use(routerObj.routes(), routerObj.allowedMethods());

        // preparing necessary "glue" for SSRMiddleware to work properly in production
        routerObj.stack.forEach(p => pathRegExps.push(pathToRegExp(p.path)));
      } catch (e) {
        console.error(e);
        process.exit(0);
      }
    });

    // storing the necessary glue for SSRMiddleware to work properly in production
    app.context.allAppPathRegExps = pathRegExps;
  };
};
