import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import rootReducer from './reducers';

export default function configureStore(initialState) {
  const composeEnhancers =
    (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
    || compose;

  // Middleware you want to use in development:
  const enhancer = composeEnhancers( applyMiddleware(thunk) );

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
