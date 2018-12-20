import { routerMiddleware } from 'connected-react-router';
import { createStore, applyMiddleware, compose } from 'redux';
import createHistory from 'history/createBrowserHistory';
import thunk from 'redux-thunk';

import createRootReducer from './reducers';

export default function configureStore(initialState) {
  const history = createHistory();
  const middleware = routerMiddleware(history);

  const enhancer = compose(
    // Middleware you want to use in development:
    applyMiddleware(middleware, thunk)
  );

  // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
  // See https://github.com/rackt/redux/releases/tag/v3.1.0
  const store = createStore(
    createRootReducer(history),
    initialState,
    enhancer
  );

  return { history, store };
}
