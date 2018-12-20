import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import rootReducer from './reducers';

export default function configureStore(initialState) {
  const enhancer = compose(
    // Middleware you want to use in development:
    applyMiddleware(thunk)
  );

  const store = createStore(
    rootReducer,
    initialState,
    enhancer
  );

  return store;
}
