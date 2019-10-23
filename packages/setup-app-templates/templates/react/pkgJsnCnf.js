'use strict';

exports = module.exports = [
  {
    cfg: {
      devDependencies: [ 'fullstack-scripts', 'prop-types' ],
      dependencies: [
        'koa',
        'koa-compress',
        'koa-morgan',
        'koa-range',
        'koa-static',
        'setup-app-ssr',
        'react',
        'react-dom'
      ]
    },
    test: () => true
  }, {
    cfg: { devDependencies: [ 'redux', 'react-redux' ] },
    test: ({ REDUX }) => REDUX
  }, {
    cfg: { devDependencies: [ 'redux-thunk' ] },
    test: ({ THUNK }) => THUNK
  }, {
    cfg: { devDependencies: [ 'react-router', 'react-router-dom', 'history' ] },
    test: ({ ROUTER }) => ROUTER
  }, {
    cfg: { devDependencies: [ 'connected-react-router' ] },
    test: ({ REDUX, ROUTER }) => ROUTER && REDUX
  }, {
    cfg: { devDependencies: [ 'postcss-preset-env' ] },
    test: ({ POSTCSS }) => POSTCSS
  }, {
    cfg: { devDependencies: [ 'node-sass', 'sass-loader' ] },
    test: ({ SASS }) => SASS
  }, {
    cfg: { devDependencies: [ 'less', 'less-loader' ] },
    test: ({ LESS }) => LESS
  }, {
    cfg: { setupApp: { csr: [ 'buildPath' ] } },
    test: ({ CSR }) => CSR
  }, {
    cfg: { dependencies: [ 'koa-rewrite' ], setupApp: { csr: [ 'devRewrite' ] } },
    test: ({ CSR, SSR }) => CSR && !SSR
  }, {
    cfg: { setupApp: { ssr: { methods: [ 'main' ] } } },
    test: ({ SSR }) => SSR
  }, {
    cfg: { setupApp: { ssr: [ { methods: [ 'initStore', 'configureStore' ] }, 'ssrMiddleware', 'buildPath' ] } },
    test: ({ SSR, REDUX }) => SSR && REDUX
  }, {
    cfg: { setupApp: [ 'defaultIndex' ] },
    test: ({ CSR, SSR }) => CSR || SSR
  }, {
    cfg: { dependencies: [ 'koa-router' ], setupApp: [ 'backendAfter', 'watchBackendFiles' ] },
    test: ({ BACKEND }) => BACKEND
  }
];
