import { routerMiddleware } from 'connected-react-router';
import { createStore, applyMiddleware, compose } from 'redux';
import createHistory from 'history/createBrowserHistory';

import createRootReducer from './reducers';

export default function configureStore(initialState) {
  const history = createHistory();
  const middleware = routerMiddleware(history);

  const composeEnhancers =
    (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
    || compose;

  // Middleware you want to use in development:
  const enhancer = composeEnhancers(
    applyMiddleware(middleware)
  );

  // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
  // See https://github.com/rackt/redux/releases/tag/v3.1.0
  const store = createStore(
    createRootReducer(history),
    initialState,
    enhancer
  );

  // Hot reload reducers (requires Webpack or Browserify HMR to be enabled)
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const createRootReducer = require('./reducers').default;
      store.replaceReducer(createRootReducer(history));
    });
  }

  return { history, store };
}
