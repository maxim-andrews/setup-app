import { combineReducers } from 'redux';

import reducers from './reducers';

const createRootReducer = () => combineReducers(reducers);

export default createRootReducer;
