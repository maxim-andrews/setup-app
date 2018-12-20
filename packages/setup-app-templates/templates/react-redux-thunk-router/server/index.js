const Koa = require('koa');
const path = require('path');
const range = require('koa-range');
const serve = require('koa-static');
const morgan = require('koa-morgan');
const compress = require('koa-compress');

const port = parseInt(process.env.PORT, 10) || 3000;

const app = new Koa();

app.use(morgan('combined'));
app.use(compress());
app.use(range);
app.use(serve(path.resolve(path.join(process.cwd(), 'build')), { defer: true }));
app.listen(port);

console.log(`Server listens on port ${port}`);
