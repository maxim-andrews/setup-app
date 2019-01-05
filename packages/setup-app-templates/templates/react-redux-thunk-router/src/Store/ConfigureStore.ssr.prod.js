import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import createRootReducer from './CreateReducers';

const enhancer = compose(applyMiddleware(thunk));

export default function configureStore(initialState) {
  // Note: only Redux >= 3.1.0 supports passing enhancer as third argument.
  // See https://github.com/rackt/redux/releases/tag/v3.1.0
  const store = createStore(
    createRootReducer(),
    initialState,
    enhancer
  );

  return store;
}
