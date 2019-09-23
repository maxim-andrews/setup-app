import { createStore } from 'redux';

// kra-mod-start
/* eslint-disable import/first */
if (KRA.CSR && KRA.SSR) {
  import createRootReducer from './CreateReducers';
} else if (KRA.SSR) {
  import createRootReducer from './CreateReducers.ssr'; // kra-mod-replace .ssr
}
/* eslint-enable import/first */
// kra-mod-end

export default function configureStore(initialState) {
  const store = createStore(
    createRootReducer(),
    initialState
  );

  return store;
}
