const Router = require('koa-router');

const router = new Router();

router
  .param('user', (userName, ctx, next) => {
    ctx.state.user = userName;
    return next();
  })
  .get('/hostosandtime', async (ctx, next) => {
    if (ctx.header.accept === 'application/json') {
      await new Promise(resolve => setTimeout(resolve, 5000));

      ctx.body = JSON.stringify({
        hostOS: process.platform,
        time: (new Date())
          .toTimeString()
          .replace(/\([^)]+\)/, '')
          .trim()
      });
      return next();
    }

    ctx.throw(404, 'not found');
  })
  .get('/users/:user', async (ctx, next) => {
    ctx.body = ctx.state.user;
    return next();
  });

exports = module.exports = router;
