import shared from '../Shared/Reducers';
// kra-mod-start
/* eslint-disable import/first */
if (KRA.THUNK) {
  import spin from '../Components/SpinLogo/reducer.thunk'; // kra-mod-replace .thunk
} else {
  import spin from '../Components/SpinLogo/reducer';
}
if (KRA.BACKEND) {

  import server from '../Components/ServerFetch/reducer';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
if (KRA.BACKEND) {
  const reducers = {
    shared,
    spin,
    server
  };
} else {
  const reducers = {
    shared,
    spin
  };
}
// kra-mod-end

export default reducers;
