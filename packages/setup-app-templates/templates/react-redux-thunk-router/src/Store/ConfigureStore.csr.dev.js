// kra-mod-start
/* eslint-disable import/first */
if (KRA.ROUTER || KRA.THUNK) {
  import { createStore, applyMiddleware, compose } from 'redux';
} else {
  import { createStore } from 'redux';
}
if (KRA.ROUTER) {

  import { routerMiddleware } from 'connected-react-router';
  import { createBrowserHistory } from 'history';
}
if (KRA.THUNK) {

  import thunk from 'redux-thunk';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.CSR && KRA.SSR) {
  import createRootReducer from './CreateReducers';
} else if (KRA.CSR) {
  import createRootReducer from './CreateReducers.csr'; // kra-mod-replace .csr
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
if (KRA.ROUTER || KRA.THUNK) {
  function getEnhancersComposer () {
    return (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
      || compose;
  }
} else {
  function getEnhancersComposer () {
    return (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
      || function () { return undefined; }
  }
}
// kra-mod-end

function configureStore(initialState) {
  // kra-mod-start
  if (KRA.ROUTER) {
    const history = createBrowserHistory();
    const middleware = routerMiddleware(history);
  }
  // kra-mod-end

  const composeEnhancers = getEnhancersComposer();

  // kra-mod-start
  if (KRA.ROUTER && KRA.THUNK) {
    // Middleware you want to use in development:
    const enhancer = composeEnhancers( applyMiddleware(middleware, thunk) );
  } else if (KRA.ROUTER) {
    // Middleware you want to use in development:
    const enhancer = composeEnhancers( applyMiddleware(middleware) );
  } else if (KRA.THUNK) {
    // Middleware you want to use in development:
    const enhancer = composeEnhancers( applyMiddleware(thunk) );
  } else {
    // Middleware you want to use in development:
    const enhancer = composeEnhancers();
  }

  if (KRA.ROUTER) {

    // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
    // See https://github.com/rackt/redux/releases/tag/v3.1.0
    const store = createStore(
      createRootReducer(history),
      initialState,
      enhancer
    );
  } else {

    // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
    // See https://github.com/rackt/redux/releases/tag/v3.1.0
    const store = createStore(
      createRootReducer(),
      initialState,
      enhancer
    );
  }
  // kra-mod-end

  // Hot reload reducers (requires Webpack or Browserify HMR to be enabled)
  if (module.hot) {
    module.hot.accept('./CreateReducers', () => {
      // kra-mod-start
      if (KRA.CSR && KRA.SSR) {
        const createRootReducer = require('./CreateReducers').default;
      } else if (KRA.CSR) {
        const createRootReducer = require('./CreateReducers.csr').default; // kra-mod-replace .csr
      }

      if (KRA.ROUTER) {
        store.replaceReducer(createRootReducer(history));
      } else {
        store.replaceReducer(createRootReducer());
      }
      // kra-mod-end
    });
  }

  // kra-mod-start
  if (KRA.ROUTER) {
    return { history, store };
  } else {
    return store;
  }
  // kra-mod-end
}

export default configureStore;
