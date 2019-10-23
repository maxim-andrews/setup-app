'use strict';

const fs = require('fs');
const os = require('os');
const c = require('chalk');
const path = require('path');
const spawn = require('cross-spawn');
const inquirer = require('inquirer');

const generate = require('./lib/generate');
const { writeToDest } = require('./lib/helpers');
const bQuestions = require('./lib/basicQuestions')();

const templatesPath = path.join(__dirname, 'templates');
const CWD = process.cwd();

const tpls = fs.readdirSync(templatesPath, 'utf8').reduce( (tpls, folder) => {
  try {
    const tpl = require(path.join(templatesPath, folder, 'tplCfg.js'));
    tpls[tpl.name] = tpl;
  } catch (e) {
    if (!e.message.includes('Cannot find module')) {
      console.log(e);
    }
  }

  return tpls;
}, {});

(async () => {
  let tpl;

  const tplsNames = Object.keys(tpls);

  if (tplsNames.length === 0) {
    console.error('There is no templates with valid config available.');
    process.exit(0);
  }

  const bAnswers = await inquirer.prompt(bQuestions);

  bAnswers.DEST = bAnswers.cwd ? CWD : path.join(CWD, bAnswers.name);
  delete bAnswers.cwd;

  if (tplsNames.length === 1) {
    tpl = tpls[tplsNames[0]];
  } else {
    const tplSelectAnswer = await inquirer.prompt({
      type: 'list',
      name: 'tpl',
      message: 'What front-end framework would you like to use?',
      choices: tplsNames
    });

    tpl = tpls[tplSelectAnswer.tpl];
  }

  console.log(`Using ${ c.cyan(tpl.name) } as your front-end framework`);

  const tplAnswers = await inquirer.prompt(tpl.questions);
  const tplVars = {};

  Object.keys(tplAnswers).forEach(key => {
    if (Array.isArray(tplAnswers[key])) {
      tplAnswers[key].forEach(opt => {
        tplVars[opt] = true;
      });
    } else if (typeof tplAnswers[key] === 'boolean') {
      tplVars[key] = tplAnswers[key];
    } else {
      console.log(key, tplAnswers[key]);
    }
  });

  // console.log(bAnswers);
  // console.log(tplVars);

  console.log(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
  console.log(`Creating a new KRA app in ${ c.green(bAnswers.DEST) }`);
  console.log();
  console.log('Generating app files...');
  let tplFiles;
  try {
    tplFiles = generate(tplVars, tpl, bAnswers.DEST);
  } catch (e) {
    console.error('Error generating files:');
    console.error(e);
    process.exit(0);
  }

  console.log();
  console.log(`Saving files to ${ c.green(bAnswers.DEST) }`);
  writeToDest(tplFiles);

  console.log();
  console.log(`Generating ${ c.green('package.json') } file...`);
  const pkgJsn = tpl.pkgJsn(bAnswers, tplVars);

  console.log();
  console.log(`Saving ${ c.green('package.json') } to ${ c.green(bAnswers.DEST) }`);
  fs.writeFileSync(
    path.join(bAnswers.DEST, 'package.json'),
    JSON.stringify(pkgJsn, null, 2) + os.EOL,
    'utf8'
  );

  console.log();
  console.log('Installing dependencies. It might take a while...');
  console.log();

  process.chdir(bAnswers.DEST);

  const result = spawn.sync('npm', [ 'i' ], { stdio: 'inherit' });

  if ([ 'SIGINT', 'SIGTERM', 'SIGKILL' ].includes(result.signal)) {
    console.log(`Interupted by ${result.signal}`);
    console.log();
    return;
  }

  console.log(`KRA generator has created your new ${ c.green(bAnswers.name) } app at ${ c.green(bAnswers.DEST) }.`);
  console.log('Now you can type the following commands in the app directory:');
  console.log();
  console.log(`  ${ c.green('npm start') }`);
  console.log('    Starts KRA server to handle development environment');
  console.log();
  console.log(`  ${ c.green('npm test') }`);
  console.log('    Runs your tests');
  console.log();
  console.log(`  ${ c.green('npm build') }`);
  console.log('    Builds your app for production deployment');
  console.log();
  console.log('We recommend to start by running:');
  console.log();
  if (CWD !== bAnswers.DEST) {
    console.log(`  cd ${ c.green(bAnswers.DEST.replace(CWD + path.sep, '')) }`);
  }
  console.log('  npm start');
  console.log();
  console.log(`${ c.green('Happy coding!') }`);
  console.log();
})();
