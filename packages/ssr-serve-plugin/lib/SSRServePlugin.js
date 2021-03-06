/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const vm = require('vm');
const mime = require('mime');
const path = require('path');
const debug = require('debug');
const { parse } = require('url');
const EventEmitter = require('events');
const querystring = require('querystring');
const MemoryFileSystem = require('memory-fs');
const WebpackKoaServer = require('webpack-koa-server');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const { SourceMapConsumer } = require('source-map');

class SSRServePlugin {
  constructor (options = {}) {
    const {
      methods,
      middleware,
      injectCss = true,
      contentWare = true,
      server,
      template,
      env = [],
      host = '0.0.0.0',
      port = 3000,
      ssl = false, // { key, cert, pfx, passphrase }
      protocol = 'http', // http | http2
      content = [],
      open = true,
      appName = 'website',
      allowedMethods = ['GET'],
      defaultIndex = 'index.html',
      proxy = false, // { proxy config }
      addMiddleware
    } = options;

    this.methods = methods;
    this.middleware = middleware;
    this.injectCss = injectCss;
    this.contentWare = contentWare;
    this.allowedMethods = allowedMethods;
    this.defaultIndex = defaultIndex;

    this.server = server instanceof WebpackKoaServer
      ? server
      : new WebpackKoaServer({
        host,
        port,
        ssl,
        protocol,
        content,
        open,
        appName,
        proxy,
        template,
        env,
        addMiddleware
      });

    this.ssrObj = {
      html: '',
      methods: {}
    };

    this.isFirstCompile = true;
    this.formatWebpackMessages = formatWebpackMessages;

    this.parseUrl = parse;
    this.mime = mime;
    this.unescape = querystring.unescape;

    this.debug = debug('ssr-serve-plugin');

    this.HASH_REGEXP = /[0-9a-f]{10,}/;

    this.emitter = new EventEmitter();
    this.contentReady = false;
  }

  apply (compiler) {
    const { watch, entry, name, target, output: { filename, publicPath, libraryTarget, path: outputPath } } = compiler.options;
    if (!watch) {
      throw Error('SSRServePlugin should be configured in `watch` only mode. Configuration option `watch` should be equal to `true`.');
    }
    if (!name) {
      throw Error('SSRServePlugin should be used in webpack configuration with unique `name` option only. This will help to identify errors and warnings.');
    }
    if (!target) {
      throw Error('SSRServePlugin should be used in webpack configuration with set `target` option only.');
    }
    if (target !== 'node') {
      throw Error('SSRServePlugin should be used in webpack configuration with option `target` set to `node` only.');
    }
    if (!libraryTarget) {
      throw Error('SSRServePlugin should be used in webpack configuration with set `output.libraryTarget` option only.');
    }
    if (libraryTarget !== 'commonjs2') {
      throw Error('SSRServePlugin should be used in webpack configuration with option `output.libraryTarget` set to `commonjs2` only.');
    }

    if (typeof outputPath === 'string' && !path.isAbsolute(outputPath)) {
      throw new Error(
        'The \'output.path\' must be an absolute path which starts with'
          + `${ process.platform === 'win32'
            ? '\'C:\\\\\' or \'C:/\' or \'//\' or \'\\\\\''
            : '\'/\'' }.`
      );
    }

    this.outputPath = outputPath;
    this.publicPath = publicPath;

    if (typeof this.methods !== 'object' || this.methods === null || !Object.keys(this.methods).length) {
      throw Error('SSRServePlugin `methods` option is required and should be an object with names as keys and value as path to a file.');
    }

    if (!this.middleware) {
      throw Error('SSRServePlugin `middleware` option is required and should be path to a file consisting Koa middleware.');
    }

    if (filename !== '[name].js') {
      throw Error('SSRServePlugin the `output.filename` option of the webpack config must be equal to \'[name].js\'');
    }

    compiler.options.entry = this.addEntryPoints(entry);

    if (compiler.outputFileSystem instanceof MemoryFileSystem) {
      this.fileSystem = compiler.outputFileSystem;
    } else {
      compiler.outputFileSystem = this.fileSystem = new MemoryFileSystem();
    }

    this.compiler = compiler;

    compiler.hooks.entryOption.tap('SSRServePlugin', this.readyStartServer.bind(this));
    compiler.hooks.done.tap('SSRServePlugin', this.compilerDone.bind(this));
    compiler.hooks.failed.tap('SSRServePlugin', this.debug);
    compiler.hooks.invalid.tap('SSRServePlugin', this.compilerIvalidated.bind(this));

    this.pluginId = this.server.registerPlugin(this);

    this.server.on('template-loaded', this.processCompiledFiles.bind(this));
    this.server.on('template-refreshed', this.processCompiledFiles.bind(this));
    this.server.on('template-updated', this.updateSsrHtml.bind(this));

    if (this.contentWare) {
      this.server.addPluginMiddleware(() => this.contentMiddleware.bind(this), 10000);
    }
    this.server.addPluginMiddleware(this.createMiddleware.bind(this), 10001);

    // Run manually once to show this compiler is compiling
    this.compilerIvalidated();
  }

  addEntryPoints(entry) {
    let newEntry;

    if (typeof entry === 'function') {
      newEntry = () => this.combineEntry(entry());
    } else {
      newEntry = this.combineEntry(entry);
    }

    return newEntry;
  }

  combineEntry (entry) {
    let combinedEntry;
    const isArray = Array.isArray(entry);
    const entryType = typeof entry;

    if(entryType === 'string' || isArray) {
      if (entryType === 'string') {
        combinedEntry = ['', 'dummystring'].includes(entry) ? {} : { [entry.replace(/\.js$/, '')]: entry };
      } else {
        combinedEntry = entry.reduce((entries, entry) => {
          entries[entry.replace(/\.js$/, '')] = entry;
          return entries;
        }, {});
      }

      combinedEntry = Object.assign(combinedEntry, this.methods);
    } else if (entryType === 'object' && !isArray && entry !== null) {
      combinedEntry = Object.assign(entry, this.methods);
    } else {
      combinedEntry = entry;
    }

    return combinedEntry;
  }

  readyStartServer () {
    this.server.emit('start-server');
  }

  compilerIvalidated (fileName) {
    this.contentReady = false;
    this.server.emit('compilation-invalid', this.pluginId);
  }

  compilerDone (stats) {
    this.lastStats = stats;
    // We only construct the warnings and errors for speed:
    // https://github.com/facebook/create-react-app/issues/4492#issuecomment-421959548
    const messages = this.formatWebpackMessages(
      stats.toJson({ all: false, warnings: true, errors: true })
    );

    this.lastMessages = messages;

    this.server.emit('compilation-done', this.pluginId, messages);

    if (!messages.errors.length && !messages.warnings.length) {
      this.server.refreshTemplate();
    }
  }

  createMiddleware() {
    // include fresh middleware if server has been restarted
    const middlewarePath = require.resolve(this.middleware);
    const middlewareModule = require(middlewarePath);
    const middleware = middlewareModule.default || middlewareModule;

    return middleware(this.ssrObj, async () => {
      return Promise.all([
        this.waitForContent(),
        this.waitForMethods()
      ]);
    });
  }

  async contentMiddleware(ctx, next) {
    const allowedMethods = this.allowedMethods;
    if (allowedMethods.indexOf(ctx.method) === -1) {
      return next();
    }

    let filename = this.extractFilename(ctx.url);

    if (!filename) {
      return next();
    }

    let shouldAwaitContent = true;
    let resourceStat;

    if (this.HASH_REGEXP.test(filename)) {
      try {
        resourceStat = this.fileSystem.statSync(filename);
        shouldAwaitContent = !resourceStat.isFile();
      } catch (e) {
        shouldAwaitContent = true;
      }
    }

    if (shouldAwaitContent) {
      await this.waitForContent();
    }

    try {
      resourceStat = this.fileSystem.statSync(filename);
    } catch (e) {
      return next();
    }

    if (resourceStat.isDirectory()
        && typeof this.defaultIndex === 'string'
        && this.defaultIndex.length > 0) {
      filename = path.join(filename, this.defaultIndex);

      try {
        resourceStat = this.fileSystem.statSync(filename);
      } catch (e) {
        return next();
      }
    }

    if (!resourceStat.isFile()) {
      return next();
    }

    ctx.type = this.mime.getType(filename); // eslint-disable-line require-atomic-updates
    ctx.body = this.fileSystem.readFileSync(filename); // eslint-disable-line require-atomic-updates
  }

  extractFilename (url) {
    const publicUrl = this.parseUrl(this.publicPath || '/', false, true);
    const requestedUrl = this.parseUrl(url);

    // publicPath is not in url, so it should fail
    if (requestedUrl.pathname.indexOf(publicUrl.pathname) !== 0) {
      return false;
    }

    const filename = requestedUrl.pathname.substring(publicUrl.pathname.length);

    return this.unescape(
      filename ? path.join(this.outputPath, filename) : this.outputPath
    );
  }

  async waitForContent () {
    if (this.contentReady) {
      return Promise.resolve();
    }

    this.debug('SSRServePlugin is waiting untill content will be available');

    return new Promise(resolve => {
      this.emitter.once('contentReady', resolve);
    });
  }

  async waitForMethods () {
    if (Object.keys(this.ssrObj.methods).length) {
      return Promise.resolve();
    }

    this.debug('SSRServePlugin is waiting untill methods will be available');

    return new Promise(resolve => {
      this.emitter.once('methodsReady', resolve);
    });
  }

  async processCompiledFiles () {
    const files = this.lastStats ? Object.keys(this.lastStats.compilation.assets) : false;

    if (files) {
      await this.processCSSFiles(files);
      this.processJavaScriptMaps(files);
      await this.processJavaScripts(files);
    }

    this.emitter.emit('methodsReady');
  }

  async processCSSFiles (files) {
    if (this.injectCss) {
      const { templateHtml, callback } = await this.server.updateTemplate();
      const cssStyles = files.filter(file => /\.css$/.test(file))
        .reduce((styles, file) => {
          const style = '<style type="text/css">\n'
            + this.fileSystem.readFileSync(path.join('/', file), 'utf8')
              .replace(/\s+\/\*# sourceMappingURL=[^*]+\*\//, '')
            + '\n\t</style>';
          if (!templateHtml.includes(style)) {
            styles.push(style);
          }
          return styles;
        }, []);

      callback(
        templateHtml.replace(
          /^(\s*)<\/head>/m,
          `$1$1${ cssStyles.join('\n\t') }\n$1</head>`
        )
      );
    }
  }

  processJavaScriptMaps (files) {
    this.ssrObj.maps = files.filter(file => /\.js.map$/.test(file))
      .reduce((maps, file) => {
        const filePath = path.join('/', file);
        const content = this.fileSystem.readFileSync(filePath, 'utf8');
        maps[file.replace(/\.js.map$/i, '').replace(/^.*\//, '')] =
          JSON.parse(content);

        return maps;
      }, {});
  }

  async processJavaScripts (files) {
    const CWD = process.cwd();
    const newRequire = moduleName => {
      try {
        return require(moduleName);
      } catch (e) { /* */ }

      return require(path.join(CWD, 'node_modules', moduleName));
    };

    const jsFiles = files.filter(file => /\.js$/.test(file));
    const methods = [];
    for (let i = 0; i < jsFiles.length; i++) {
      const file = jsFiles[i];
      const methodName = file.replace(/\.js$/i, '').replace(/^.*\//, '');
      const content = this.fileSystem.readFileSync(path.join('/', file), 'utf8');
      const sandbox = { module: {}, require: newRequire };

      try {
        const script = new vm.Script(content);
        vm.createContext(sandbox);
        script.runInContext(sandbox, { filename: file, displayErrors: true, breakOnSigint: true });
      } catch (e) {
        const stackArray = e.stack.replace(e.message, '').split('\n');
        const sourceConsumer = await new SourceMapConsumer(this.ssrObj.maps[methodName]);

        const restStack = stackArray.slice(1).map((traceLine, i) => {
          if (!traceLine.includes('anonymous')) {
            return i === 0
              ? traceLine.replace(/(\s*at)[^(]+\(([^)]+)\)/i, '$1 $2')
              : traceLine;
          }
          const lineColumn = traceLine.split(':').slice(1).map(int => parseInt(int, 10));
          const original = sourceConsumer.originalPositionFor({ line: lineColumn[0], column: lineColumn[1] });
          return traceLine.replace(/\([^)]+\)$/, `(${original.source}:${original.line}:${original.column})`);
        });
        console.error('\x1b[31m\x1b[1m%s\x1b[0m', `Pre SSR ${ e.constructor.name }:\n${ e.message }`);
        console.error('\x1b[31m%s\x1b[0m', restStack.join('\n'));
        // process.exit(0);
      }

      const method = sandbox.module.exports;
      methods[methodName] = (method && method.default) || method;
    }

    this.ssrObj.methods = methods;
  }

  updateSsrHtml (templateHtml) {
    this.ssrObj.html = templateHtml;
    this.contentReady = true;
    this.emitter.emit('contentReady');
  }
}

module.exports = SSRServePlugin;
