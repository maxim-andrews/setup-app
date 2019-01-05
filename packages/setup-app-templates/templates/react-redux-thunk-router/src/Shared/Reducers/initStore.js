exports = module.exports = ctx => ({
  serverOnly: (ctx && ctx.state.serverSideOnly) || false
});
