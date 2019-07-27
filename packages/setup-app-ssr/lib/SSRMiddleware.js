'use strict';

const path = require('path');
const { SourceMapConsumer } = require('source-map');

const CWD = process.cwd();
const ReactDOMServer = require(path.join(CWD, 'node_modules', 'react-dom', 'server'));
const pkgJsn = require(path.join(CWD, 'package.json'));
const setupApp = pkgJsn.setupApp || {};

const defaultOptions = {
  initStore: 'initStore',
  configureStore: 'configureStore',
  contentMethods: { }
};

exports = module.exports = configOpts => {
  const options = Object.assign(defaultOptions, configOpts);

  // wrapper method to avoid user interactions with internals like SSRObject
  // and waitUntilReady
  return (ssrObject, waitUntilReady) => {

    if (typeof ssrObject === 'undefined') {
      ssrObject = require('./SSRObject')();
    }

    return async (ctx, next) => {
      // we should wait if we if in development mode
      if (typeof waitUntilReady === 'function') {
        await waitUntilReady();
      }

      const methods = ssrObject.methods;
      const maps = ssrObject.maps;

      if (typeof setupApp.csr === 'boolean' && setupApp.csr === false) {
        ctx.state.serverSideOnly = true;
      }

      const initStore = options.initStore;
      const configureStore = options.configureStore;

      if (typeof configureStore === 'string'
          && typeof methods[configureStore] === 'function') {

        const initialStore = typeof initStore === 'string'
          && typeof methods[initStore] === 'function'
          ? methods[initStore](ctx) : {};

        ctx.state.store = methods[configureStore](initialStore);
      }

      await next();

      if (!ctx.body && ssrObject.html) {
        const ctxMtds = options.contentMethods;
        ctx.body = ssrObject.html;

        await Promise.all(Object.keys(ctxMtds).map(
          processMethod.bind(null, methods, maps, ctx, ctxMtds)
        ));
      }
    };
  };
};

async function processMethod (methods, maps, ctx, ctxMtds, method) {
  try {
    const methodOutput = ReactDOMServer.renderToString( methods[method]({
      path: ctx.path,
      store: ctx.state.store
    }) );

    const methodType = typeof ctxMtds[method];

    if (methodType === 'object'
      && ctxMtds[method] !== null) {
      const { match, replacement } = ctxMtds[method];
      ctx.body = ctx.body
        .replace(
          match,
          replacement.replace('#@#output#@#', methodOutput)
        );
    } else if ( methodType === 'function' ) {
      ctx.body = ctxMtds[method](ctx.body, methodOutput);
    } else if ( methodType === 'string' ) {
      ctx.body = ctx.body
        .replace( ctxMtds[method], methodOutput );
    }
  } catch (e) {
    await showError(e, maps[method]);
  }
}

async function showError (e, map) {
  // React Developers copy error message to stack
  // This line removes unnecessary duplicate message in stack
  // https://github.com/facebook/react/issues/16188
  const stackArray = e.stack.replace(e.message, '').split('\n');
  const sourceConsumer = await new SourceMapConsumer(map);
  const restStack = stackArray.slice(1).map((traceLine, i) => {
    if (!traceLine.includes('anonymous')) {
      return i === 0
        ? traceLine.replace(/(\s*at)[^(]+\(([^)]+)\)/i, '$1 $2')
        : traceLine;
    }
    const lineColumn = traceLine.split(':').slice(1).map(int => parseInt(int, 10));
    const original = sourceConsumer.originalPositionFor({ line: lineColumn[0], column: lineColumn[1] });
    return traceLine.replace(/\([^)]+\)$/, `(${original.source}:${original.line}:${original.column})`);
  });
  console.error('\x1b[31m\x1b[1m%s\x1b[0m', `SSR ${ e.constructor.name }:\n${ e.message }`);
  console.error('\x1b[31m%s\x1b[0m', restStack.join('\n'));
}
