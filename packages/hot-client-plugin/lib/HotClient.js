/**
 * Copyright (c) partly belongs to Maxim Andrews, maximandrews.com
 * The rest of the Copyright (c) belongs to authors according to notes below
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Copyright (c) on the four lines of code below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// This is alternative WebpackServe hot client

// It only supports their simplest configuration (hot updates on same server).
// It makes some opinionated choices on top, like adding a syntax error overlay
// that looks similar to our console output. The error overlay is inspired by:
// https://github.com/glenjamin/webpack-hot-middleware

var stripAnsi = require('strip-ansi');
var url = require('url');
var formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
var ErrorOverlay = require('react-error-overlay');

// Copyright (c) on the code part below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// We need to keep track of if there has been a runtime error.
// Essentially, we cannot guarantee application state was not corrupted by the
// runtime error. To prevent confusing behavior, we forcibly reload the entire
// application. This is handled below when we are notified of a compile (code
// change).
// See https://github.com/facebookincubator/create-react-app/issues/3096
var hadRuntimeError = false;
ErrorOverlay.startReportingRuntimeErrors({
  onError: function() {
    hadRuntimeError = true;
  },
  filename: '/static/js/bundle.js',
});

// Copyright (c) on the block below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
if (module.hot && typeof module.hot.dispose === 'function') {
  module.hot.dispose(function() {
    // TODO: why do we need this?
    ErrorOverlay.stopReportingRuntimeErrors();
  });
}

// eslint-disable-next-line no-unused-vars, no-undef
var options = __webpackHotClientOptions__;

if (!options) {
  throw new Error(
    'Something went wrong and __webpackHotClientOptions__ is undefined. Possible bad build. HMR cannot be enabled.'
  );
}

var host = options.host;

// Connect to WebsocketServerPlugin via a socket.
var connection = new WebSocket(
  url.format({
    protocol: options.https ? 'wss' : 'ws',
    hostname: ['*','0.0.0.0'].includes(host) ? window.location.hostname : host,
    port: options.port,
    slashes: true,
  })
);

connection.addEventListener('open', function() {
  console.info(
    'HotClientPlugin has connected.'
  );
});

// Unlike WebpackDevServer and WebpackServe client, we won't try to reconnect
// to avoid spamming the console. Disconnect usually happens
// when developer stops the server.
connection.addEventListener('close', function() {
  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(
      'HotClientPlugin has disconnected.\nRefresh the page if necessary.'
    );
  }
});

ErrorOverlay.setEditorHandler(function editorHandler(errorLocation) {
  // Keep this sync with errorOverlayMiddleware.js
  connection.send(JSON.stringify({
    type: 'launch-editor',
    data: {
      fileName: errorLocation.fileName,
      lineNumber: errorLocation.lineNumber || 1,
      colNumber: errorLocation.colNumber || 1
    }
  }), () => { alert('sent'); });
});

// Copyright (c) on the three lines of code below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// Remember some state related to hot module replacement.
var isFirstCompilation = true;
var mostRecentCompilationHash = null;
var hasCompileErrors = false;

// Copyright (c) on the function below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
function clearOutdatedErrors() {
  // Clean up outdated compile errors, if any.
  if (typeof console !== 'undefined' && typeof console.clear === 'function') {
    if (hasCompileErrors) {
      console.clear();
    }
  }
}

// Copyright (c) on the function below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// Successful compilation.
function handleSuccess() {
  clearOutdatedErrors();

  var isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates(function onHotUpdateSuccess() {
      // Only dismiss it when we're sure it's a hot update.
      // Otherwise it would flicker right before the reload.
      ErrorOverlay.dismissBuildError();
    });
  }
}

// Copyright (c) on the function below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// Compilation with warnings (e.g. ESLint).
function handleWarnings(warnings) {
  clearOutdatedErrors();

  var isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  function printWarnings() {
    // Print warnings to the console.
    var formatted = formatWebpackMessages({
      warnings: warnings,
      errors: [],
    });

    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      for (var i = 0; i < formatted.warnings.length; i++) {
        if (i === 5) {
          console.warn(
            'There were more warnings in other files.\n' +
              'You can find a complete log in the terminal.'
          );
          break;
        }
        console.warn(stripAnsi(formatted.warnings[i]));
      }
    }
  }

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates(function onSuccessfulHotUpdate() {
      // Only print warnings if we aren't refreshing the page.
      // Otherwise they'll disappear right away anyway.
      printWarnings();
      // Only dismiss it when we're sure it's a hot update.
      // Otherwise it would flicker right before the reload.
      ErrorOverlay.dismissBuildError();
    });
  } else {
    // Print initial warnings immediately.
    printWarnings();
  }
}

// Copyright (c) on the function below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors(errors) {
  clearOutdatedErrors();

  isFirstCompilation = false;
  hasCompileErrors = true;

  // "Massage" webpack messages.
  var formatted = formatWebpackMessages({
    errors: errors,
    warnings: [],
  });

  // Only show the first error.
  ErrorOverlay.reportBuildError(formatted.errors[0]);

  // Also log them to the console.
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    for (var i = 0; i < formatted.errors.length; i++) {
      console.error(stripAnsi(formatted.errors[i]));
    }
  }

  // Do not attempt to reload now.
  // We will reload on next success instead.
}

// Copyright (c) on the function below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// There is a newer version of the code available.
function handleAvailableHash(hash) {
  // Update last known compilation hash.
  mostRecentCompilationHash = hash;
}

// Handle messages from the server.
connection.addEventListener('message', function(e) {
  var message = JSON.parse(e.data);

  switch (message.type) {
    case 'compile':
      console.info(`Webpack compiling ${message.data}`);
      break;
    case 'invalid':
      console.info(`Webpack recompiling file ${message.data}`);
      break;
    case 'hash':
      handleAvailableHash(message.data);
      break;
    case 'still-ok':
    case 'ok':
      handleSuccess();
      break;
    case 'static-changed':
      // Triggered when a file from `staticContent` changed.
      window.location.reload();
      break;
    case 'warnings':
      handleWarnings(message.data);
      break;
    case 'errors':
      // if it is first compilation Webpack emits standard error
      hasCompileErrors = isFirstCompilation || hasCompileErrors;
      handleErrors(message.data);
      break;
    case 'unauthorised-editor-launch':
      unauthorisedEditorLaunch(message.data);
      break;
    default:
    // Do nothing.
  }
});

// Show information div about unauthorised editor launch
function unauthorisedEditorLaunch(ipAddress) {
  var dismiss, msgBtn, msgSpan, msgDiv, bgDiv, infoDiv = document.getElementById('__webpack_hot_dev_info_div__');

  if (!infoDiv) {
    infoDiv = document.createElement('div');
    infoDiv.setAttribute('id', '__webpack_hot_dev_info_div__');
    infoDiv.style.position = 'fixed';
    infoDiv.style.zIndex = 9999999999999999;
    infoDiv.style.top = 0;
    infoDiv.style.left = 0;
    infoDiv.style.width = '100%';
    infoDiv.style.height = '100%';
    infoDiv.style.backgroundColor = 'transparent';
    infoDiv.style.display = 'none';
    infoDiv.style.opacity = 0;
    infoDiv.style.transition = 'opacity 0.2s ease-out 0s';
    infoDiv.style.fontFamily = 'sans-serif';
    infoDiv.style.fontSize = '16px';

    dismiss = function() {
      infoDiv.style.opacity = 0;
      setTimeout(function() {
        infoDiv.style.display = 'none';
      }, 200);
    }

    bgDiv = document.createElement('div');
    bgDiv.style.position = 'relative';
    bgDiv.style.width = '100%';
    bgDiv.style.height = '100%';
    bgDiv.style.backgroundColor = '#000';
    bgDiv.style.opacity = 0.5;
    bgDiv.addEventListener('click', dismiss);

    msgDiv = document.createElement('div');
    msgDiv.setAttribute('id', '__webpack_hot_dev_msg_div__');
    msgDiv.style.position = 'absolute';
    msgDiv.style.zIndex = 1;
    msgDiv.style.top = '50%';
    msgDiv.style.left = '50%';
    msgDiv.style.padding = '35px';
    msgDiv.style.transform = 'translate(-50%, -50%)';
    msgDiv.style.backgroundColor = '#fff';
    msgDiv.style.opacity = 1;
    msgDiv.style.textAlign = 'center';
    msgDiv.style.verticalAlign = 'middle';
    msgDiv.style.boxSizing = 'border-box';

    msgSpan = document.createElement('span');
    msgSpan.setAttribute('id', '__webpack_hot_dev_msg_span__');

    msgBtn = document.createElement('button');
    msgBtn.style.border = '1px solid rgb(206, 17, 38)';
    msgBtn.style.marginTop = '30px';
    msgBtn.style.padding = '10px 30px';
    msgBtn.style.backgroundColor = 'rgba(206, 17, 38, 0.05)';
    msgBtn.style.color = 'rgb(206, 17, 38)';
    msgBtn.style.fontSize = '16px';
    msgBtn.innerHTML = 'Dismiss';
    msgBtn.addEventListener('click', dismiss);

    msgDiv.appendChild(msgSpan);
    msgDiv.appendChild(document.createElement('br'));
    msgDiv.appendChild(msgBtn);
    infoDiv.appendChild(bgDiv);
    infoDiv.appendChild(msgDiv);
    document.body.appendChild(infoDiv);
  } else {
    msgDiv = document.getElementById('__webpack_hot_dev_msg_div__');
    msgSpan = document.getElementById('__webpack_hot_dev_msg_span__');
  }

  msgSpan.innerHTML = `Your machine IP address '${ipAddress}' is not allowed to launch an editor on the host machine.`;
  msgDiv.style.width = document.body.clientWidth > 640 ? '40%' : '95%';
  infoDiv.style.opacity = 0;
  infoDiv.style.display = 'block';
  setTimeout(function() {
    infoDiv.style.opacity = 1;
  }, 0);
}

// Copyright (c) on the code below belongs to Facebook, Inc., taken from react-dev-utils/webpackHotDevClient
// Is there a newer version of this code available?
function isUpdateAvailable() {
  /* globals __webpack_hash__ */
  // __webpack_hash__ is the hash of the current compilation.
  // It's a global variable injected by Webpack.
  return mostRecentCompilationHash !== __webpack_hash__;
}

// Webpack disallows updates in other states.
function canApplyUpdates() {
  return module.hot.status() === 'idle';
}

// Attempt to update code on the fly, fall back to a hard reload.
function tryApplyUpdates(onHotUpdateSuccess) {
  if (!module.hot) {
    // HotModuleReplacementPlugin is not in Webpack configuration.
    window.location.reload();
    return;
  }

  if (!isUpdateAvailable() || !canApplyUpdates()) {
    return;
  }

  function handleApplyUpdates(err, updatedModules) {
    if (err || !updatedModules || hadRuntimeError) {
      window.location.reload();
      return;
    }

    if (typeof onHotUpdateSuccess === 'function') {
      // Maybe we want to do something.
      onHotUpdateSuccess();
    }

    if (isUpdateAvailable()) {
      // While we were updating, there was a new update! Do it again.
      tryApplyUpdates();
    }
  }

  // https://webpack.github.io/docs/hot-module-replacement.html#check
  var result = module.hot.check(/* autoApply */ true, handleApplyUpdates);

  // // Webpack 2 returns a Promise instead of invoking a callback
  if (result && result.then) {
    result.then(
      function(updatedModules) {
        handleApplyUpdates(null, updatedModules);
      },
      function(err) {
        handleApplyUpdates(err, null);
      }
    );
  }
}
