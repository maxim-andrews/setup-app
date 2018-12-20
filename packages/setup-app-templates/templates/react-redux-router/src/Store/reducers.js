import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import shared from '../Shared/Reducers';
import spin from '../Components/SpinLogo/reducer';

const createRootReducer = history => combineReducers({
  router: connectRouter(history),
  shared,
  spin
});

export default createRootReducer;
