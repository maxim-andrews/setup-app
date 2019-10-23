const Router = require('koa-router');

const router = new Router({ prefix: '/spin' });

const { spinReact, spinRedux } = require('./actions');

router
  .get('/', async (ctx, next) => {
    try {
      if (ctx.query.type === 'React') {
        ctx.state.store.dispatch(spinReact());
      } else if (ctx.query.type === 'Redux') {
        ctx.state.store.dispatch(spinRedux());
      } else {
        next();
      }
    } catch (e) {
      console.log(e);
    }
  });

exports = module.exports = router;
