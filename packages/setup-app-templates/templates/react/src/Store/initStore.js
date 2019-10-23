const shared = require('../Shared/Reducers/initStore');
// kra-mod-start
if (KRA.THUNK) {
  const spin = require('../Components/SpinLogo/initStore.thunk'); // kra-mod-replace .thunk
} else {
  const spin = require('../Components/SpinLogo/initStore');
}
if (KRA.BACKEND) {

  const server = require('../Components/ServerFetch/initStore');

  exports = module.exports = ctx => ({
    shared: shared(ctx),
    spin: spin(ctx),
    server: server(ctx)
  });
} else {

  exports = module.exports = ctx => ({
    shared: shared(ctx),
    spin: spin(ctx)
  });
}
// kra-mod-end
