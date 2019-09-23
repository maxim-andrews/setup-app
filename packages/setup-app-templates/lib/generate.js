'use strict';

const path = require('path');
const babelEslint = require('babel-eslint');
const pluginFlowtype = require('eslint-plugin-flowtype');
const pluginImport = require('eslint-plugin-import');
const pluginJsxA11y = require('eslint-plugin-jsx-a11y');
const pluginReact = require('eslint-plugin-react');
const esLintConfig = require('eslint-config-setup-app');
const Linter = require("eslint").Linter;

const { pathWalkers } = require('./walkers');
const { sourceParser,
        walker,
        resolveFile,
        processComment,
        processKRA,
        processFile,
        sortNums,
        sortByEndLine } = require('./helpers');

function prepareLinterRules (plugin) {
  const pluginName = plugin.configs.recommended.plugins[0];
  return Object.keys(plugin.rules).reduce((rulesObj, curName) => {
    rulesObj[`${pluginName}/${curName}`] = plugin.rules[curName];
    return rulesObj;
  }, {});
}

const linter = new Linter();
const allRules = Object.assign(
  {},
  prepareLinterRules(pluginFlowtype),
  prepareLinterRules(pluginImport),
  prepareLinterRules(pluginJsxA11y),
  prepareLinterRules(pluginReact)
);

esLintConfig.rules = Object.assign(
  {},
  pluginFlowtype.configs.recommended.rules,
  pluginImport.configs.recommended.rules,
  pluginJsxA11y.configs.recommended.rules,
  pluginReact.configs.recommended.rules,
  esLintConfig.rules
);

delete esLintConfig.rules['import/no-unresolved'];

linter.defineParser('babel-eslint', babelEslint);
linter.defineRules(allRules);

/*
FILES object structure
{
  source: '',
  parse: true,
  parsed: false,
  lineRpl: {},
  dest: ''
}
*/
const FILES = {};
const FILES_TO_PARSE = [];

exports = module.exports = (KRAVARS, tplCfg, dstDir) => {
  tplCfg.entryFiles(KRAVARS).forEach( entryFile =>
    processFile(
      FILES,
      FILES_TO_PARSE,
      entryFile,
      tplCfg.rootDir,
      tplCfg.rootDir,
      dstDir
    )
  );

  while (FILES_TO_PARSE.length > 0) {
    const curFile = FILES_TO_PARSE.shift();

    if (FILES[curFile].parse !== true || FILES[curFile].parsed === true) {
      continue;
    }

    const MODIFICATIONS = [];
    let KRAMODIFY;

    let esTree = sourceParser.parse(FILES[curFile].source, {
      ecmaVersion: 10,
      sourceType: 'module',
      allowImportExportEverywhere: true,
      locations: true,
      onComment (block, text, start, end, sLoc, eLoc) {
        KRAMODIFY = processComment (
          curFile,
          FILES[curFile].source,
          text,
          start,
          end,
          sLoc,
          eLoc,
          KRAMODIFY,
          MODIFICATIONS
        );
      }
    });

    if (typeof KRAMODIFY === 'object' && typeof KRAMODIFY.end === 'undefined') {
      console.log(
        `\x1b[31mUnclosed kra-mod-start at ${curFile}:${KRAMODIFY.startLine}:${KRAMODIFY.startCol}\x1b[0m\u0007`
      );
    }

    // console.log(curFile);

    if (MODIFICATIONS.length > 0) {
      // console.log(`Found modifications in \u001b[1m${entryPoint}\u001b[0m`);
      MODIFICATIONS.sort(sortByEndLine).reverse();

      MODIFICATIONS.forEach(mod => {
        const modCode = processKRA(mod.text, KRAVARS);

        FILES[curFile].source =
          FILES[curFile].source.substring(0, mod.start)
          + modCode.replace(/\n\s+$/, '')
          + FILES[curFile].source.substring(mod.end);
      });
    }

    // console.log(FILES[curFile].source);

    try {
      esTree = sourceParser.parse(FILES[curFile].source, {
        ecmaVersion: 10,
        sourceType: 'module',
        allowImportExportEverywhere: true,
        locations: true,
        onComment (block, text, start, end, sLoc) {
          const kraReplace = text
                              .trim()
                              .toLowerCase()
                              .indexOf('kra-mod-replace') === 0;

          if (block === false && kraReplace === true) {
            const match = text.trim().split(' ');

            if (typeof FILES[curFile].lineRpl === 'undefined') {
              FILES[curFile].lineRpl = {};
            }

            FILES[curFile].lineRpl[sLoc.line] = {
              match: match[1],
              rpl: match[2] || '',
              cmStart: start,
              cmEnd: end
            }
          }
        }
      });
    } catch (e) {
      console.error('Error parsing file:');
      console.error(curFile);
      console.error(e);
    }

    try {
      walker.simple(esTree, pathWalkers, undefined, {
        processFile,
        CPD: path.dirname(curFile), // CPD -> 'Current Parsing Directory' for resolving required or imported files
        FILES,
        FILES_TO_PARSE,
        curFileObj: FILES[curFile],
        srcDir: tplCfg.rootDir,
        dstDir
      });
    } catch (e) {
      console.error('Error walking file:');
      console.error(curFile);
      console.error(e);
    }

    if (FILES[curFile].lineRpl) {
      const pathRpl = Object.keys(FILES[curFile].lineRpl)
        .map(key => parseInt(key, 10))
        .sort(sortNums)
        .reverse();

      pathRpl.forEach(line => {
        const rpl = FILES[curFile].lineRpl[line];
        FILES[curFile].source =
          FILES[curFile].source.substring(0, rpl.cmStart).replace(/\s+$/, '')
          + FILES[curFile].source.substring(rpl.cmEnd);
        FILES[curFile].source =
          FILES[curFile].source.substring(0, rpl.start)
          + FILES[curFile].source.substring(rpl.start, rpl.end).replace(rpl.match, rpl.rpl)
          + FILES[curFile].source.substring(rpl.end);
      });
      // console.log(curFile, FILES[curFile].lineRpl);
    }

    const linterOut = linter.verifyAndFix(FILES[curFile].source, esLintConfig);
    if (linterOut.messages.length) {
      console.log(linterOut);
    }

    if (linterOut.fixed === true) {
      FILES[curFile].source = linterOut.output;
    }

    FILES[curFile].source = FILES[curFile].source.replace(/\n\s+\n/g, '\n\n');

    FILES[curFile].parsed = true;
  }

  // console.log(Object.keys(FILES).map(file => ({ [file]: FILES[file].dest })));

  return FILES;
};
