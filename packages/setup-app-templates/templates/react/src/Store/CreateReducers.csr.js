import { combineReducers } from 'redux';
// kra-mod-start
/* eslint-disable import/first */
if (KRA.ROUTER) {
  import { connectRouter } from 'connected-react-router';
}
/* eslint-enable import/first */
// kra-mod-end

import reducers from './reducers';

// kra-mod-start
if (KRA.ROUTER) {
  const createRootReducer = history => combineReducers(Object.assign(
    reducers,
    { router: connectRouter(history) }
  ));
} else {
  const createRootReducer = () => combineReducers(reducers);
}
// kra-mod-end

export default createRootReducer;
