import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import shared from '../Shared/Reducers';
import spin from '../Components/SpinLogo/reducer';
import server from '../Components/ServerFetch/reducer';

const createRootReducer = history => combineReducers({
  router: connectRouter(history),
  shared,
  spin,
  server
});

export default createRootReducer;
