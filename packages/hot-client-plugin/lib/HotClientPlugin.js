/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const net = require('net');
const path = require('path');
const WebSocket = require('ws');
const ip6addr = require('ip6addr');
const chokidar = require('chokidar');
const { DefinePlugin, HotModuleReplacementPlugin } = require('webpack');

const debug = require('debug');
const launchEditor = require('react-dev-utils/launchEditor');

class HotClientPlugin {
  constructor (options = {}) {
    const {
      host = '0.0.0.0',
      port = 8081,
      hotClient = require.resolve('./HotClient'),
      hmr = undefined,
      errors = true,
      warnings = true,
      editor = {
        allowedIPs: '127.0.0.1'
      },
      staticContent = false
    } = options;

    this.host = host;
    this.port = port;
    this.hotClient = hotClient;
    this.hmr = hmr;
    this.errors = errors;
    this.warnings = warnings;
    this.editor = editor;
    this.editorIPRanges = [];
    this.staticContent = staticContent ? path.resolve(staticContent) : false;

    this.handlerServerConnection = this.handlerServerConnection.bind(this);
    this.handlerServerListening = this.handlerServerListening.bind(this);
    this.handlerStaticContentChanged = this.handlerStaticContentChanged.bind(this);

    this.launchEditor = launchEditor;
    this.debug = debug('hot-client-plugin');
    this.chokidar = chokidar;

    this.validateEditorIPs();
    this.preapareEditorIPs();
  }

  apply (compiler) {
    const { watch, entry } = compiler.options;
    if (!watch) {
      throw Error('HotClientPlugin should be configured in `watch` only mode. Configuration option `watch` should be equal to `true`.');
    }

    if (this.hotClient !== false) {
      compiler.options.entry = this.newEntry(entry);
    }

    this.runServer();

    compiler.hooks.afterPlugins.tap('HotClientPlugin', this.handlerAfterPlugins.bind(this));
    compiler.hooks.compile.tap('HotClientPlugin', this.handlerCompile.bind(this, compiler));
    compiler.hooks.invalid.tap('HotClientPlugin', this.handlerInvalid.bind(this, compiler));
    compiler.hooks.done.tap('HotClientPlugin', this.handlerDone.bind(this));
  }

  handlerAfterPlugins (compiler) {
    // Defining global browser variable to pass host and port for Websocket client
    const definePlugin = new DefinePlugin({
      __webpackHotClientOptions__: JSON.stringify({
        host: this.host,
        port: this.port
      })
    });
    definePlugin.apply(compiler);

    // Automatically adding Hot Module Replacement Plugin if not added
    const hmrAdded = (compiler.options.plugins || []).some(
      plugin => plugin instanceof HotModuleReplacementPlugin
    );

    if (!hmrAdded) {
      (new HotModuleReplacementPlugin(this.hmr)).apply(compiler);
    }
  }

  handlerCompile (compiler) {
    this.propagateAll('compile', compiler.name || '<noname compiller>');
  }

  handlerInvalid (compiler, filePath) {
    const contentBase = compiler.context || compiler.options.context || process.cwd();
    const file = (filePath || '<unknown>')
      // Stripping base folder
      .replace(contentBase, '')
      // Stripping forwardslash
      .substring(1);

    this.debug('Received webpack invalidation event for file %s', file);

    this.propagateAll('invalid', file);
  }

  handlerDone (stats) {
    // Storing compiler stats for newely connected Websocket clients
    this.compilerStats = stats.toJson(stats);

    // Propagating stats to all Websocket clients
    this.sendStats();
  }

  newEntry (entry) {
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

    if(entryType === 'string') {
      combinedEntry = [this.hotClient, entry];
    } else if (isArray && !entry.includes(this.hotClient)) {
      // Add hotClient after polyfills, but before other entrypoints
      let insertIndex;
      entry.forEach((entry, idx) => {
        // Looking for last polyfill index
        if (entry.indexOf('polyfill') > -1) {
          insertIndex = idx;
        }
      });

      insertIndex = isNaN(insertIndex) ? 0 : insertIndex + 1;

      combinedEntry = [...entry];

      combinedEntry.splice(insertIndex, 0, this.hotClient);

    } else if (entryType === 'object' && !isArray && entry !== null) {
      let i = 0, propertyName = 'hotClient';
      while (entry[propertyName]) {
        propertyName = 'hotClient' + (++i);
      }

      combinedEntry = Object.assign(entry, { [propertyName]: this.hotClient });
    } else {
      combinedEntry = entry;
    }

    return combinedEntry;
  }

  sendStats (client) {
    const {
      errors = [],
      assets = [],
      hash = '',
      warnings = []
    } = this.compilerStats;
    const propagate = client
      ? HotClientPlugin.propagate.bind(null, client)
      : this.propagateAll.bind(this);

    if (errors.length > 0) {
      if (this.errors) {
        propagate('errors', errors);
      }
      return;
    }

    if (assets.length > 0 && assets.every(asset => !asset.emitted)) {
      return propagate('still-ok');
    }

    propagate('hash', hash);

    if (warnings.length > 0) {
      if (this.warnings) {
        propagate('warnings', warnings);
      }
    } else {
      propagate('ok');
    }
  }

  propagateAll (type, data, sender) {
    this.server.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && (!sender || sender !== client)) {
        HotClientPlugin.propagate(client, type, data);
      }
    });
  }

  static propagate (client, type, data) {
    client.send(JSON.stringify({ type, data }));
  }

  validateEditorIPs(ips) {
    ips = ips || this.editor.allowedIPs;

    if (Array.isArray(ips)) {
      ips.forEach(this.validateEditorIPs.bind(this));
    } else if (typeof ips === 'object' && ips !== null) {
      const firstVersion = net.isIP(ips.first);
      const lastVersion = net.isIP(ips.last);

      if (![4,6].includes(firstVersion)) {
        throw Error(`Please check option editor.allowedIPs value(s).\nAn object property 'first' should be valid IPv4 or IPv6 address.\nFor instance '127.0.0.1' or '::ffff:c0a8:0001'.\n You entered '${ips.first}'.`);
      }

      if (firstVersion !== lastVersion) {
        throw Error(`Please check option editor.allowedIPs value(s).\nAn object property 'last' should be valid IPv4 or IPv6 address matching the type of address in property 'first'.\nFor instance '128.25.31.5' or '::ffff:c0a8:1'.\nYou entered '${ips.first}' as 'first' property which is IPv${firstVersion} and '${ips.last}' as 'last' property which is IPv${lastVersion}.`);
      }

      const compared = ip6addr.compare(ips.first, ips.last);

      if (compared > 0) {
        throw Error(`Please check option editor.allowedIPs value(s).\nAn object property 'first' should have IP addrress which comes before IP address in object property 'last'.\n You entered '${ips.first}' as 'first' which comes after '${ips.last}' entered as 'last'.`);
      }
    } else if (typeof ips === 'string') {
      const [ ipAddress, bitMask ] = ips.split('/');
      const ipVersion = net.isIP(ipAddress);

      if (ips === 'any') {
        return true;
      }

      if (![4,6].includes(ipVersion)) {
        throw Error(`Please check option editor.allowedIPs value(s).\nThe IP adress you entered '${ips}' should be valid IPv4 or IPv6 address or CIDR or reserved word 'any'.`);
      }

      // eslint-disable-next-line
      if ((bitMask && parseInt(bitMask, 10) != bitMask) || bitMask < 1 || (ipVersion === 4 && bitMask > 32) || (ipVersion === 6 && bitMask > 128)) {
        throw Error(`Please check option editor.allowedIPs value(s).\nBit mask of the network should be an integer between 1 and 32 for IPv4 address or between 1 and 128 for IPv6 address.\nFor instance: 127.0.0.1/32 or ::ffff:c0a8:0001/128\nYou entered ${ips} where bitmask is ${bitMask}.`);
      }
    } else {
      throw Error('Configuration option editor.allowedIPs should be <string>, <array> or not null <object>');
    }
  }

  preapareEditorIPs (ips) {
    ips = ips || this.editor.allowedIPs;

    if (Array.isArray(ips)) {
      ips.forEach(this.preapareEditorIPs.bind(this));
    } else if (typeof ips === 'object') {
      this.addEditorIPRange(ips);
    } else if (typeof ips === 'string') {
      const [ ipAddress, bitMask ] = ips.split('/');
      const ipVersion = net.isIP(ipAddress);

      if (ipAddress === 'any') {
        return this.addEditorIPRange({ first: '::', last: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' });
      }

      const netBits = parseInt(bitMask || (ipVersion === 4 ? 32 : 128));
      const subnet = ip6addr.createCIDR(ipAddress, netBits);

      this.addEditorIPRange({ first: subnet.first().toString(), last: subnet.last().toString() });
    }
  }

  addEditorIPRange (ipRange) {
    const newRange = {
      ...ipRange,
      range: ip6addr.createAddrRange( ipRange.first, ipRange.last )
    };

    for(
      let i = 0, sRange,
        containsFirst, containsLast,
        containsReverseFirst, containsReverseLast; i < this.editorIPRanges.length; i++) {
      sRange = this.editorIPRanges[i];
      containsFirst = sRange.range.contains(newRange.first);
      containsLast = sRange.range.contains(newRange.last);

      if (containsFirst || containsLast) {
        if (!containsFirst) {
          this.editorIPRanges[i].first = newRange.first;
        }

        if (!containsLast) {
          this.editorIPRanges[i].last = newRange.last;
        }

        this.editorIPRanges[i].range = ip6addr.createAddrRange(
          this.editorIPRanges[i].first,
          this.editorIPRanges[i].last
        );
        return;
      }

      containsReverseFirst = newRange.range.contains(sRange.first);
      containsReverseLast = newRange.range.contains(sRange.last);

      if (containsReverseFirst && containsReverseLast) {
        this.editorIPRanges.splice(i, 1, newRange);
        return;
      }
    }

    this.editorIPRanges.push(newRange);
  }

  editorIPAllowed(ipAddress) {
    for(let i = 0, range;i < this.editorIPRanges.length;i++) {
      range = this.editorIPRanges[i].range;

      if (range.contains(ipAddress)) {
        return true;
      }
    }

    return false;
  }

  runServer () {
    this.debug('Starting server on port %s:%d ...', this.host, this.port);

    this.server = new WebSocket.Server({
      host: this.host,
      port: this.port
    });

    this.server.on('connection', this.handlerServerConnection);
    this.server.on('error', this.handlerServerError);
    this.server.on('listening', this.handlerServerListening);
  }

  handlerServerConnection (ws, req) {
    this.debug('WebSocket client (%s) is connected', req.connection.remoteAddress);

    ws.on('message', this.handlerServerSocketMessage.bind(this, ws, req));
    ws.on('error', this.handlerServerSocketError.bind(null, req));

    if (this.compilerStats) {
      this.sendStats(ws);
    }
  }

  handlerServerSocketMessage (ws, req, data) {
    const action = JSON.parse(data);

    switch (action.type) {
      case 'launch-editor': {
        if (this.editorIPAllowed(req.connection.remoteAddress)) {
          const { fileName, lineNumber, colNumber } = action.data;

          this.debug('Launching an editor from %s', req.connection.remoteAddress);
          this.launchEditor(fileName, lineNumber, colNumber);
        } else {
          this.debug('Unauthorised editor launch attemp from %s', req.connection.remoteAddress);
          ws.send(JSON.stringify({ type: 'unauthorised-editor-launch', data: req.connection.remoteAddress }));
        }
        break;
      }
      default: {
        this.debug('Unknown message (%s): %O', req.connection.remoteAddress, action);
        break;
      }
    }
  }

  handlerServerSocketError (req, e) {
    this.debug('WebSocket client (%s) error: %O', req.connection.remoteAddress, e);
  }

  handlerServerError (e) {
    this.debug('WebSocket server error: %O', e);
  }

  handlerServerListening () {
    const { address, port } = this.server.address();

    this.host = address;
    this.port = port;

    this.debug('WebSocket server listening at %s:%d', this.host, this.port);

    if (this.staticContent) {
      this.debug('Start watching folder %s', this.staticContent);

      this.contentWatcher = this.chokidar.watch(this.staticContent);

      this.contentWatcher
        .on('add', this.handlerStaticContentChanged)
        .on('addDir', this.handlerStaticContentChanged)
        .on('change', this.handlerStaticContentChanged)
        .on('unlink', this.handlerStaticContentChanged)
        .on('unlinkDir', this.handlerStaticContentChanged);
    }
  }

  handlerStaticContentChanged () {
    this.debug('Static content changed: %s', this.staticContent);
    this.propagateAll('static-changed');
  }
}

module.exports = HotClientPlugin;
