'use strict';

const fs = require('fs');
const path = require('path');

const { Parser } = require('acorn');
const jsxPlugin = require('acorn-jsx');

const walker = require('acorn-walk');
const { extend } = require('acorn-jsx-walk');

const { kraWalkers } = require('./walkers');

const sourceParser = Parser.extend( jsxPlugin() );

extend( walker.base );

const FILE_EXT = ['web.mjs', 'mjs', 'web.js', 'js', 'web.jsx', 'jsx'];

function resolveFile (file, ext, exts=FILE_EXT.slice(0)) {
  let fStats;

  const realPath = file + (ext ? `.${ext}` : '');

  try {
    fStats = fs.statSync(realPath);
  } catch (e) {
    if (exts.length > 0) {
      return resolveFile(file, exts.shift(), exts);
    } else {
      return;
    }

  }

  if (fStats.isDirectory()) {
    return resolveFile(path.join(file, 'index'), ext, exts);
  }

  if (fStats.isFile()) {
    return realPath;
  }

  throw new Error(`There is no file or directory available at ${file}`);
}

function processComment (entryPoint, fullSource, text, start, end, sLoc, eLoc, KRAMODIFY, MODIFICATIONS) {
  const lowerText = text.trim().toLowerCase();

  if (typeof KRAMODIFY !== 'undefined' && lowerText === 'kra-mod-start') {
    console.log(`\x1b[31mUnclosed kra-mod-start at ${entryPoint}:${KRAMODIFY.startLine}:${KRAMODIFY.startCol}\x1b[0m\u0007`);
    KRAMODIFY = undefined;
  }

  if (lowerText === 'kra-mod-start') {
    KRAMODIFY = {
      start,
      textStart: end,
      startLine: parseInt(sLoc.line, 10),
      startCol: parseInt(sLoc.column, 10),
      endLine: parseInt(eLoc.line, 10),
      endCol: parseInt(eLoc.column, 10),
    };
  } else if (lowerText === 'kra-mod-end') {
    if (typeof KRAMODIFY !== 'undefined') {
      KRAMODIFY.textEnd = start;
      KRAMODIFY.end = end;
      KRAMODIFY.text = fullSource.substring(
        KRAMODIFY.textStart,
        KRAMODIFY.textEnd
      );
      MODIFICATIONS.push(KRAMODIFY);
      KRAMODIFY = undefined;
    } else {
      console.log(`\x1b[31mUnnecessary kra-mod-end at ${entryPoint}:${sLoc.line}:${sLoc.column}\x1b[0m\u0007`);
    }
  }

  return KRAMODIFY;
}

function processKRA (str, KRAVARS) {
  let esTree;

  try {
    esTree = sourceParser.parse(str, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      locations: true
    });
  } catch (e) {
    console.error('Error parsing KRA:');
    console.log(str);
    console.error(e);
  }

  // console.log(str);
  // console.dir(esTree, { depth: null });
  // process.exit();

  const globalState = { vars: { KRA: KRAVARS }, fullSource: str };
  try {
    walker.recursive(esTree, globalState, kraWalkers);
  } catch (e) {
    console.error('Error walking KRA:');
    console.log(str);
    console.error(e);
  }

  if (globalState.modifications) {
    globalState.modifications.sort(sortByEnd);
  }

  const result = globalState.modifications
    ? globalState.modifications.map(mod => mod.source).join('')
    : '';

  // console.log(result);

  return result;
}

function processFile (
  FILES,
  FILES_TO_PARSE,
  file,
  CPD,
  srcDir,
  dstDir,
  pathMatch,
  pathMod = ''
) {
  // console.log(path.join(CPD, file), path.resolve(path.join(CPD, file)));
  const fileToProcess = resolveFile(path.resolve(path.join(CPD, file)));

  // console.log('fileToProcess', fileToProcess);

  if (typeof FILES[fileToProcess] !== 'undefined') {
    // console.log('IGNORED');
    return;
  }

  // console.log(fileDest);
  const fileDotExt = path.extname(fileToProcess);
  const fileExt = fileDotExt.replace(/^\./, '');
  // console.log(fileExt, FILE_EXT.includes(fileExt) ? 'to parse' : 'to copy');

  const fileName = path.basename(fileToProcess, fileDotExt);
  const dirName = path.dirname(file);
  const fileTmpDest = pathMatch ? path.resolve(path.join(CPD, file.replace(pathMatch, pathMod))) : fileToProcess;

  let fileTmpEnsExt = fileTmpDest;

  if (fileTmpEnsExt.indexOf(fileDotExt) === -1) {
    fileTmpEnsExt += fileDotExt;
  }

  FILES[fileToProcess] = {
    source: fs.readFileSync(fileToProcess, FILE_EXT.includes(fileExt) ? 'utf8' : undefined),
    parse: FILE_EXT.includes(fileExt),
    parsed: false,
    dest: srcDir !== dstDir ? fileTmpEnsExt.replace(srcDir, dstDir) : fileTmpEnsExt
  };

  if (FILE_EXT.includes(fileExt) && !FILES_TO_PARSE.includes(fileToProcess)) {
    FILES_TO_PARSE.push(fileToProcess);
  }

  //console.log('\n');
}

// KEEP THIS FUNCTION FOR DEBUG
function sortByFolderFile (a, b) {
  const folderA = path.dirname(a);
  const folderB = path.dirname(b);
  const fileA = path.basename(a);
  const fileB = path.basename(b);

  if (folderA === folderB) {
    if (fileA > fileB) {
      return 1;
    } else if (fileA < fileB) {
      return -1;
    } else {
      return 0;
    }
  }

  if (folderA.includes(folderB)) {
      return 1;
    }

  if (folderB.includes(folderA)) {
    return -1;
  }

  if (folderA > folderB) {
    return 1;
  }

  if (folderA < folderB) {
    return -1;
  }
}

function sortNums (a, b) {
  return a - b;
}

function sortByEndLine (a, b) {
  return a.endLine - b.endLine;
}

function sortByEnd (a, b) {
  return a.end - b.end;
}

function versionCompare (v1, v2) {
  const ver1 = v1.replace(/^v/ig, '').split('.');
  const ver2 = v2.replace(/^v/ig, '').split('.');

  for (let i = 0; i < ver1.length && i < ver2.length; i++) {
    const n1 = parseInt(ver1[i], 10);
    const n2 = parseInt(ver2[i], 10);
    if (n1 > n2) {
      return 1;
    } else if (n1 < n2) {
      return -1;
    }
  }

  return 0;
}

function mkdirp (folder) {
  if (versionCompare(process.version, '10.0.0') >= 0) {
    return fs.mkdirSync(folder, { recursive: true });
  }

  const pathObj = path.parse(folder);

  folder
    .split(path.sep)
    .reduce((fullPath, curFolder) => {
      const curFullPath = path.join(fullPath, curFolder);
      if (!fs.existsSync(curFullPath)) {
        fs.mkdirSync(curFullPath);
      }

      return curFullPath;
    }, pathObj.root);
}

function writeToDest (FILES) {
  Object.keys(FILES).forEach( origName => {
    const file = FILES[origName];
    const folder = path.dirname(file.dest);
    const fileExt = path.extname(file.dest).replace(/^\./, '');

    mkdirp(folder);
    fs.writeFileSync(file.dest, file.source, FILE_EXT.includes(fileExt) ? 'utf8' : undefined);
  });
}

function copyPkgJsnProps (pkgTpl, pkgOut, cfgObj) {
  if (typeof cfgObj === 'string') {
    pkgOut[cfgObj] = pkgTpl[cfgObj];
  } else if (Array.isArray(cfgObj)) {
    cfgObj.forEach(subObj => {
      copyPkgJsnProps(pkgTpl, pkgOut, subObj);
    });
  } else if (typeof cfgObj === 'object') {
    Object.keys(cfgObj).forEach(
      cfgKey => {
        if (typeof pkgOut[cfgKey] === 'undefined') {
          pkgOut[cfgKey] = {};
        }
        // console.log('before', cfgKey, cfgObj[cfgKey], pkgTpl[cfgKey], pkgOut[cfgKey]);
        copyPkgJsnProps(pkgTpl[cfgKey], pkgOut[cfgKey], cfgObj[cfgKey]);
        // console.log('after', cfgKey, cfgObj[cfgKey], pkgTpl[cfgKey], pkgOut[cfgKey]);
      }
    );
  }
}

exports = module.exports = {
  sourceParser,
  walker,
  resolveFile,
  processComment,
  processKRA,
  processFile,
  mkdirp,
  writeToDest,
  sortNums,
  sortByEndLine,
  copyPkgJsnProps
};
