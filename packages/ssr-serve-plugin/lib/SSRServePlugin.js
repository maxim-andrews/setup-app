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
const listAll = require('list-all');
const EventEmitter = require('events');
const querystring = require('querystring');
const MemoryFileSystem = require('memory-fs');
const WebpackKoaServer = require('webpack-koa-server');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');

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

    this.listAll = listAll;
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
      this.server.appendMiddleware(() => this.contentMiddleware.bind(this), 10000);
    }
    this.server.appendMiddleware(this.createMiddleware.bind(this), 10001);

    // Run manually once to show this compiler is compiling
    this.compilerIvalidated();
  }

  addEntryPoints(entry) {
    let newEntry;

    if (typeof entry === 'function') {
      newEntry = () => this.combineEntry(entry(...arguments));
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

  compilerIvalidated () {
    this.contentReady = false;

    this.fileSystem
      .readdirSync('/', 'utf8')
      .filter(file => /\.css$/.test(file) || /\.css\.map$/.test(file))
      .forEach(file => this.fileSystem.unlinkSync( path.join('/', file) ) );

    this.server.emit('compilation-invalid', this.pluginId);
  }

  compilerDone (stats) {
    // We only construct the warnings and errors for speed:
    // https://github.com/facebook/create-react-app/issues/4492#issuecomment-421959548
    const messages = this.formatWebpackMessages(
      stats.toJson({ all: false, warnings: true, errors: true })
    );

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

    ctx.type = this.mime.getType(filename);
    ctx.body = this.fileSystem.readFileSync(filename);
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
    const files = this.listAll('/', this.fileSystem);
    this.ssrObj.methods = files.filter(file => /\.js$/.test(file))
      .reduce((methods, file) => {
        const content = this.fileSystem.readFileSync(path.join('/', file), 'utf8');
        const sandbox = { module: {} };
        let script;
        try {
          script = new vm.Script(content);
          vm.createContext(sandbox);
          script.runInContext(sandbox, {
            filename: file,
            displayErrors: true,
            breakOnSigint: true
          });
        } catch (e) {
          this.debug(e);
        }

        const method = sandbox.module.exports;
        methods[file.replace(/\.js$/i, '').replace(/^.*\//, '')] = method.default || method;

        return methods;
      }, {});

    if (this.injectCss) {
      const cssStyles = files.filter(file => /\.css$/.test(file))
        .map(file =>
          '\t<style type="text/css">\n'
          + this.fileSystem.readFileSync(path.join('/', file), 'utf8')
          + '\n\t</style>'
        );

      const { templateHtml, callback } = await this.server.updateTemplate();
      callback(
        templateHtml.replace(
          /^(\s*)<\/head>/m,
          `$1$1${ cssStyles.join('\n') }\n$1</head>`
        )
      );
    }

    this.emitter.emit('methodsReady');
  }

  updateSsrHtml (templateHtml) {
    this.ssrObj.html = templateHtml;
    this.contentReady = true;
    this.emitter.emit('contentReady');
  }
}

module.exports = SSRServePlugin;
