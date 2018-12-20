import { combineReducers } from 'redux';

import shared from '../Shared/Reducers';
import spin from '../Components/SpinLogo/reducer';

export default combineReducers({
  spin,
  shared
});
