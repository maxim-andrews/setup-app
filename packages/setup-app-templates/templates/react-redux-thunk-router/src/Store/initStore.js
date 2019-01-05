const shared = require('../Shared/Reducers/initStore');
const spin = require('../Components/SpinLogo/initStore');
const server = require('../Components/ServerFetch/initStore');

exports = module.exports = ctx => ({
  shared: shared(ctx),
  spin: spin(ctx),
  server: server(ctx)
});
