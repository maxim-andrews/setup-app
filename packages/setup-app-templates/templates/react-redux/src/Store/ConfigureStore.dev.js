import { createStore } from 'redux';

import rootReducer from './reducers';

export default function configureStore(initialState) {
  const composeEnhancers =
    (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
    || undefined;

  // Middleware you want to use in development:
  const enhancer = typeof composeEnhancers === 'function' ? composeEnhancers() : undefined;

  // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
  // See https://github.com/rackt/redux/releases/tag/v3.1.0
  const store = createStore(
    rootReducer,
    initialState,
    enhancer
  );

  // Hot reload reducers (requires Webpack or Browserify HMR to be enabled)
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const rootReducer = require('./reducers').default;
      store.replaceReducer(rootReducer);
    });
  }

  return store;
}
