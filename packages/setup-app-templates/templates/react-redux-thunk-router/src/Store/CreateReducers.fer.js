import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import reducers from './reducers';

const createRootReducer = history => {
  return combineReducers(
    Object.assign(
      reducers,
      { router: connectRouter(history) }
    ));
};

export default createRootReducer;
