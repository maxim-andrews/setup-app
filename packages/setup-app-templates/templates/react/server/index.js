const path = require('path');
const Koa = require('koa');
const range = require('koa-range');
const serve = require('koa-static');
const morgan = require('koa-morgan');
const compress = require('koa-compress');
// kra-mod-start
if (KRA.CSR && KRA.SSR !== true) {
  const rewrite = require('koa-rewrite');
}
// kra-mod-end

// kra-mod-start
if (KRA.BACKEND && KRA.SSR) {
  const routes = require('./routes');
  const ssrMiddleware = require('./ssrMiddleware');
} else if (KRA.BACKEND) {
  const routes = require('./routes');
} else if (KRA.SSR) {
  const ssrMiddleware = require('./ssrMiddleware');
}
// kra-mod-end

const CWD = process.cwd();
const pkgJsn = require(path.join(CWD, 'package.json'));
const setupApp = pkgJsn.setupApp || {};
const csrCfg = setupApp.csr || {};
const absolutePublicPath = path.resolve(
  path.join(CWD, csrCfg.buildPath || 'build/client')
);

const port = parseInt(process.env.PORT, 10) || 3000;

const app = new Koa();

app.use(morgan('combined'));
app.use(compress());
app.use(range);

// kra-mod-start
if (KRA.CSR && KRA.SSR !== true) {
  const { regexp: regexpstr, modifier } = csrCfg.devRewrite;
  app.use(rewrite(new RegExp(regexpstr, modifier || ''), `/${ setupApp.defaultIndex || 'index.html' }`));
}
// kra-mod-end

// kra-mod-start
if (KRA.BACKEND && KRA.SSR) {
  app.use(ssrMiddleware());
  routes(app);
} else if (KRA.BACKEND) {
  routes(app);
} else if (KRA.SSR) {
  app.use(ssrMiddleware());
}
// kra-mod-end

app.use(serve(absolutePublicPath));
app.listen(port);

console.log(`Server listens on port ${port}`);
