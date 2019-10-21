// kra-mod-start
if (KRA.CSR) {
exports = module.exports = ctx => ({
  React: true,
  Redux: false
});
} else {
  exports = module.exports = ctx => {
    const initState = {
      React: true,
      Redux: false
    };

    if (ctx) {
      initState.path = ctx.path;
    }

    return initState;
  };
}
// kra-mod-end
