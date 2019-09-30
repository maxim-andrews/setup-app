'use strict';

const kraWalkers = {
  IfStatement: (node, state, c) => {
    const { type, loc, test, consequent, alternate, start, end } = node;
    // console.log(type);
    // const stSource = state.fullSource.substring(start, end);
    // console.log(stSource);
    // console.dir(Object.keys(node), { depth: null });
    const cleanState = Object.assign({}, state);
    delete cleanState.modifications;

    const testState = Object.assign({}, cleanState);
    c(test, testState);
    // console.log('testRes', testState.label, testState.value);
    let mods = [];
    // console.log();
    if (testState.value) {
      const conseqState = Object.assign({}, cleanState);
      c(consequent, conseqState);
      if (Array.isArray(conseqState.modifications)) {
        mods = mods.concat(conseqState.modifications);
      }
    } else if (alternate !== null) {
      const alterState = Object.assign({}, cleanState);
      c(alternate, alterState);
      if (Array.isArray(alterState.modifications)) {
        mods = mods.concat(alterState.modifications);
      }
    }

    if (mods.length > 0) {
      if (!Array.isArray(state.modifications)) {
        state.modifications = [];
      }
      state.modifications = state.modifications.concat(mods);
    }
  },
  LogicalExpression: (node, state, c) => {
    const { type, loc, left, operator, right, start, end } = node;
    // console.log(type);
    // console.log(state.fullSource.substring(start, end));
    // console.dir(Object.keys(node), { depth: null });
    // console.log('executing left');
    const leftState = Object.assign({}, state);
    c(left, leftState);
    // console.log('leftRes', leftState.label, leftState.value);
    if (leftState.value && operator === '||') {
      state.label = `${leftState.label}`;
      state.value = leftState.value;
      // console.log();
      return;
    }
    // console.log('executing right');
    const rightState = Object.assign({}, state);
    c(right, rightState);
    // console.log('rightRes', rightState.label, rightState.value);
    // console.log();
    state.label = `${leftState.label} ${operator} ${rightState.label}`;
    state.value = operator === '&&'
      ? leftState.value && rightState.value
      : rightState.value;
  },
  BinaryExpression: (node, state, c) => {
    const { type, loc, start, end, left, operator, right } = node;
    // console.log(type, operator);
    // console.log(state.fullSource.substring(start, end));
    // console.dir(Object.keys(node), { depth: null });
    // console.log('executing left');
    const leftState = Object.assign({}, state);
    c(left, leftState);
    // console.log('leftRes', leftState.label, leftState.value);
    // console.log('executing right');
    const rightState = Object.assign({}, state);
    c(right, rightState);
    // console.log('rightRes', rightState.label, rightState.value);
    // console.log();
    state.label = `${leftState.label} ${operator} ${rightState.label}`;
    switch (operator) {
      case '&': {
        state.value = leftState.value & rightState.value;
        break;
      }
      case '|': {
        state.value = leftState.value | rightState.value;
        break;
      }
      case '==': {
        state.value = leftState.value == rightState.value;
        break;
      }
      case '!=': {
        state.value = leftState.value != rightState.value;
        break;
      }
      case '>=': {
        state.value = leftState.value >= rightState.value;
        break;
      }
      case '<=': {
        state.value = leftState.value <= rightState.value;
        break;
      }
      case '===': {
        state.value = leftState.value === rightState.value;
        break;
      }
      case '!==': {
        state.value = leftState.value !== rightState.value;
        break;
      }
      default: {
        console.log('\n\nKRA walker.\nNot defined operator:', operator);
        console.log();
        console.log();
        break;
      }
    }
  },
  MemberExpression: (node, state, c) => {
    const { type, loc, object, property, start, end } = node;
    // console.log(type);
    // console.log(state.fullSource.substring(start, end));
    // console.dir(Object.keys(node), { depth: null });
    const objState = Object.assign({}, state);
    c(object, objState);
    if (typeof objState.value === 'undefined' || typeof property === 'undefined') {
      return;
    }
    // console.log('obj', objState.label, objState.value);
    const propState = { vars: objState.value };
    c(property, propState);
    // console.log('prop', `${objState.label}.${propState.label}`, propState.value);
    // console.log();
    state.label = `${objState.label}.${propState.label}`;
    state.value = propState.value;
  },
  Identifier: (node, state, c) => {
    const { type, loc, name, start, end } = node;
    // console.log(type, name);
    // console.log(state.fullSource.substring(start, end));
    // console.dir(Object.keys(node), { depth: null });
    // console.log(name, state.vars[name]);
    // console.log();
    state.label = name;
    state.value = state.vars[name];
  },
  Literal: (node, state, c) => {
    const { type, loc, value, start, end, raw } = node;
    // console.log(type, value, raw);
    // console.log(state.fullSource.substring(start, end));
    // console.dir(Object.keys(node), { depth: null });
    // console.log(value);
    state.label = raw;
    state.value = value;
    // console.log();
  },
  BlockStatement: (node, state, c) => {
    const { type, loc, body, start, end } = node;
    // console.log(type, start, end);
    // console.log(state.fullSource.substring(start, end));
    // console.dir(Object.keys(node), { depth: null });
    const cleanState = Object.assign({}, state);
    delete cleanState.modifications;

    let blockStart = start + 1;
    let mods = [];
    body.forEach(bNode => {
      // console.log(bNode);
      if (bNode.type === 'IfStatement') {
        mods.push({
          start: blockStart,
          end: bNode.start,
          source: state.fullSource.substring(blockStart, bNode.start).replace(/^\n/, '').replace(/\n$/, '')
        });
        const bodyState = Object.assign({}, cleanState);
        c(bNode, bodyState);
        if (Array.isArray(bodyState.modifications)) {
          mods = mods.concat(bodyState.modifications);
        }
        blockStart = bNode.end + 1;
      }
    });
    mods.push({
      start: blockStart,
      end: end - 1,
      source: state.fullSource.substring(blockStart, end - 1).replace(/^\n/, '').replace(/\n$/, '')
    });
    // console.log(mods);
    // console.log();
    state.modifications = mods;
  }
};

function processIncludedFile (filePath, endLine, state, start, end) {
  if (/^\.{0,2}\//.test(filePath)) {
    //console.log('Found \u001b[1mimport\u001b[0m');
    const {
      processFile,
      FILES,
      FILES_TO_PARSE,
      CPD,
      curFileObj,
      srcDir,
      dstDir
    } = state;
    const LINE_RPL = curFileObj.lineRpl;
    const params = [ FILES, FILES_TO_PARSE, filePath, CPD, srcDir, dstDir ];

    if (LINE_RPL && LINE_RPL[endLine]) {
      const mod = LINE_RPL[endLine];
      params.push(mod.match);
      params.push(mod.rpl);

      LINE_RPL[endLine].start = start;
      LINE_RPL[endLine].end = end;
    }

    processFile.apply(null, params);
  }
}

const pathWalkers = {
  ImportDeclaration: (node, state) => {
    processIncludedFile(node.source.value, node.loc.end.line, state, node.start, node.end);
  },
  CallExpression: (node, state) => {
    if (node.callee.name === 'require') {
      processIncludedFile(node.arguments[0].value, node.loc.end.line, state, node.start, node.end);
    }
  }
};

exports = module.exports = {
  kraWalkers,
  pathWalkers
};
