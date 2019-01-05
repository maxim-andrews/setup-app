const path = require('path');
const Koa = require('koa');
const range = require('koa-range');
const serve = require('koa-static');
const morgan = require('koa-morgan');
const compress = require('koa-compress');

const routes = require('./routes');
const ssrMiddleware = require('./ssrMiddleware');

const CWD = process.cwd();
const pkgJsn = require(path.join(CWD, 'package.json'));
const setupApp = pkgJsn.setupApp || {};
const frontCfg = setupApp.fer || {};
const absolutePublicPath = path.resolve(
  path.join(CWD, frontCfg.buildPath || 'build/client')
);

const port = parseInt(process.env.PORT, 10) || 3000;

const app = new Koa();

app.use(morgan('combined'));
app.use(compress());
app.use(range);

app.use(ssrMiddleware());
routes(app);

app.use(serve(absolutePublicPath));
app.listen(port);

console.log(`Server listens on port ${port}`);
