<div align="center" style="margin-bottom:20px">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![NPM badge][npm-badge]][npm-url]

[![version][npm]][npm-url]
[![node][node]][node-url]
[![Semver][semver]][semver-url]

[![Build Status][build]][build-url]
[![Code Coverage][codecov]][codecov-url]
[![size][size]][size-url]

[![Dependency Status][deps]][deps-url]
[![devDependency Status][devDeps]][devDeps-url]
[![peerDependencies Status][peerDeps]][peerDeps-url]


[![Hits Counter][hits]][hits-url]

# Hot Client Plugin
A [webpack 4](https://github.com/webpack/webpack) plugin (websocket server/client) for interacting with webpack Hot Module Replacement plugin. It replaces `webpack-serve` built-in opinionated `webpack-hot-client`.

Helps to improve productivity by dynamically applying webpack updates and:
* showing compiler and app errors across all browsers and consoles (DevTools etc) in which app is opened;
* opening specific line and column of the file with error when clicked on the error message in a browser;
* hands-free refreshing or re-applying after error has been fixed, just save the file.

<p align='center'>
<img src='https://cdn.rawgit.com/marionebl/create-react-app/9f62826/screencast-error.svg' width='600' alt='Build errors'>
</p>

The plugin actually utilises `react-error-overlay` to display errors. Therefore, picture above is copied from [create-react-app](https://github.com/facebook/create-react-app).

Hot Client Plugin works on macOS and should work on Windows, and Linux (has not been tested).
If something doesn't work, please [file an issue](https://github.com/maxim-andrews/hot-client-plugin/issues/new/choose).

## Browser Support
The [only browsers](https://caniuse.com/#feat=websockets) with support of *native* **WebSocket** will work with this plugin.

## Requirements
This plugin requires a minimum of Node.js v8.11.3, Webpack v4.0.0 and [WebpackServe](https://github.com/webpack-contrib/webpack-serve).

## Installation
**You’ll need to have Node >= 8 on your local development machine** (but it’s not required on the server). You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to easily switch Node versions between different projects.

To install plugin, you may choose one of the following methods:

### npm
```sh
npm i hot-client-plugin --save-dev
```

### Yarn
```sh
yarn add hot-client-plugin --dev
```

## Configuration

### Webpack Configuration

#### Entry
The Hot Client Plugin will add `hot-client` entry to [webpack configuration](https://webpack.js.org/configuration/entry-context/#entry) automatically.

#### Plugins
You have to add HotClientPlugin to [plugins section](https://webpack.js.org/configuration/plugins/#plugins). Not to be confused with `resolve.plugins`.

The `HotClientPlugin` do not depends on the order in the `plugins` array. It is possible to add it in any preferable order.

Note: Don't forget to require or import `HotClientPlugin` module.

```js
//...
const HotClientPlugin = require('hot-client-plugin');
//...

module.exports = {
  //...
  plugins: [
    //...
    new HotClientPlugin(),
    //...
  ]
};
```

Also, it is possible to pass optional [options object](#list-of-available-hot-client-plugin-constructor-options) to the plugin constructor like this:

```js
//...
plugins: [
  //...
  new HotClientPlugin({
    host: '127.0.0.2',
    port: 8081,
    editor = {
      allowedIPs: 'any'
    }
  }),
  //...
]
//...
```

There is no need to include `webpack.HotModuleReplacementPlugin`. It will be added by `HotClientPlugin` automatically.

### WebpackServe Configuration
The built-in hot client should be disabled by setting [options.hotClient](https://github.com/webpack-contrib/webpack-serve#optionshotclient) to false.

```js
module.exports = {
  //...
  hotClient: false,
  //...
}
```

### List of available Hot Client Plugin constructor options
The `options` object is optional.

#### host

Type: `String`
Default: `0.0.0.0`

The ip address of the WebSocket server.

#### port

Type: `Number`
Default: `8081`

The port of the WebSocket server.

#### hotClient

Type: `String`
Default: `require.resolve('./HotClient')`

#### hmr

Type: `Object|undefined`
Default: `undefined`

The settings object for `webpack.HotModuleReplacementPlugin` plugin. Will be passed to constructor.

#### errors

Type: `Boolean`
Default: `true`

Set to `false` to stop sending compiler errors to your browser, but will keep displaying run-time errors.

#### warnings

Type: `Boolean`
Default: `true`

Set to `false` to stop sending compiler warnings to your browser, but will keep displaying run-time warnings.

#### editor

Type: `Object`
Default: `{ allowedIPs: '127.0.0.1' }`

The editor launching options. At the moment supports only `allowedIPs` option.

#### editor.allowedIPs

Type: `String|Array|Object`
Default: `127.0.0.1`

The ip address(es) allowed to launch the editor on the host machine. Supports both IPv4 and IPv6. Also, supports CIDR.

Examples:
```js
{
  editor: {
    allowedIPs: [
      '127.0.0.1',
      '192.168.101.1/24',
      {
        first: '172.0.0.1',
        last: '172.0.0.55'
      },
      '::ffff:c0a8:f23',
      '::ffff:c0a8:f23/96',
      {
        first: '::ffff:c0a8:0001',
        last: '::ffff:c0a8:ffff'
      },
      [ '127.0.0.2', '127.0.0.3' ]
    ]
  }
}
```

#### staticContent

Type: `Boolean|String`
Default: `false`

An absolute path to a static content folder (assets like index.html, favicon, images etc.). This option will enable monitoring of the static assets. If any of the assets will change `HotClientPlugin` will reload a page.

## Contributing

We'd love to have your helping hand on `hot-client-plugin`! See [CONTRIBUTING.md](https://github.com/maxim-andrews/hot-client-plugin/blob/master/.github/CONTRIBUTING.md) for more information on what we're looking for and how to get started.

## License

Hot Client Plugin is open source software [licensed as MIT](https://github.com/maxim-andrews/hot-client-plugin/blob/master/LICENSE)

[npm]: https://badge.fury.io/js/hot-client-plugin.svg
[npm-url]: https://npmjs.com/package/hot-client-plugin

[node]: https://img.shields.io/node/v/hot-client-plugin.svg
[node-url]: https://nodejs.org

[build]: https://travis-ci.org/maxim-andrews/hot-client-plugin.png?branch=master
[build-url]: https://travis-ci.org/maxim-andrews/hot-client-plugin

[codecov]: https://codecov.io/gh/maxim-andrews/hot-client-plugin/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/maxim-andrews/hot-client-plugin

[hits]: http://hits.dwyl.io/maxim-andrews/hot-client-plugin.svg
[hits-url]: http://hits.dwyl.io/maxim-andrews/hot-client-plugin

[semver]: http://img.shields.io/SemVer/2.0.0.png
[semver-url]: http://semver.org/spec/v2.0.0.html

[deps]: https://david-dm.org/maxim-andrews/hot-client-plugin.svg
[deps-url]: https://david-dm.org/maxim-andrews/hot-client-plugin

[devDeps]: https://david-dm.org/maxim-andrews/hot-client-plugin/dev-status.svg
[devDeps-url]: https://david-dm.org/maxim-andrews/hot-client-plugin#info=devDependencies

[peerDeps]: https://david-dm.org/maxim-andrews/hot-client-plugin/peer-status.svg
[peerDeps-url]: https://david-dm.org/maxim-andrews/hot-client-plugin?type=peer

[npm-badge]: https://nodei.co/npm/hot-client-plugin.png

[size]: https://packagephobia.now.sh/badge?p=hot-client-plugin
[size-url]: https://packagephobia.now.sh/result?p=hot-client-plugin
