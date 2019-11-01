/**
 * Copyright (c) 2018-present, Maxim Andrews, maximandrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');
const crypto = require('crypto');

const MODULES_PATH = path.join(process.cwd(), 'node_modules');

function json2RegExp (obj) {
  if (Array.isArray(obj)) {
    return obj.map(json2RegExp);
  }

  if (typeof obj === 'object' && obj !== null) {
    if (obj.regexp) {
      return new RegExp(obj.regexp, obj.mods || '');
    } else {
      return Object.keys(obj).reduce((rsObj, key) => {
        rsObj[key] = json2RegExp(obj[key]);
        return rsObj;
      }, {});
    }
  }

  return obj;
}

const relsoveModule = moduleName => path.resolve(MODULES_PATH, moduleName);
const getLocalIdent = (context, localIdentName, localName, options) => {
  const passPhrase = `${context.resourcePath
    .replace(context.rootContext, '')
    .replace(/\.[a-z0-9]+$/i, '')} ${localName}`;
  const hash = crypto.createHash('sha256').update(passPhrase);
  return hash.digest('base64')
    .replace(/[^a-z]+/ig, '')
    .substring(0, 5);
};

module.exports = {
  json2RegExp,
  relsoveModule,
  getLocalIdent
};
