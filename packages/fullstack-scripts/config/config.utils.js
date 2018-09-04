/**
 * Copyright (c) 2018, Maxim Andrews, MaximAndrews.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

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

module.exports = {
  json2RegExp
};
