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
  import createRootReducer from './CreateReducers.csr';  // kra-mod-replace .csr
}
/* eslint-enable import/first */
// kra-mod-end

function configureStore(initialState) {
  // kra-mod-start
  if (KRA.ROUTER) {
    const history = createBrowserHistory();
    const middleware = routerMiddleware(history);

  }

  if (KRA.ROUTER && KRA.THUNK) {
    // Middleware you want to use in development:
    const enhancer = compose( applyMiddleware(middleware, thunk) );
  } else if (KRA.ROUTER) {
    // Middleware you want to use in development:
    const enhancer = compose( applyMiddleware(middleware) );
  } else if (KRA.THUNK) {
    // Middleware you want to use in development:
    const enhancer = compose( applyMiddleware(thunk) );
  }

  if (KRA.ROUTER) {

    // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
    // See https://github.com/rackt/redux/releases/tag/v3.1.0
    const store = createStore(
      createRootReducer(history),
      initialState,
      enhancer
    );
  } else if (KRA.THUNK) {

    // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
    // See https://github.com/rackt/redux/releases/tag/v3.1.0
    const store = createStore(
      createRootReducer(),
      initialState,
      enhancer
    );
  } else {

    const store = createStore(
      createRootReducer(),
      initialState
    );
  }

  if (KRA.ROUTER) {

    return { history, store };
  } else {

    return store;
  }
  // kra-mod-end
}

export default configureStore;
