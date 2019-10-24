/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: [require.resolve('@babel/preset-react'), require.resolve('@babel/preset-env')],
  plugins: [require.resolve('babel-plugin-add-module-exports')],
  babelrc: false,
});
