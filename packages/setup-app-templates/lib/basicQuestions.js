'use strict';

const fs = require('fs');
const c = require('chalk');
const path = require('path');
const { execSync } = require('child_process');
const validatePkgName = require('validate-npm-package-name');
const validatePkgLicense = require('validate-npm-package-license');

const validateName = pkgName => {
  const response = [];
  const validated = validatePkgName(pkgName);
  if (validated.validForNewPackages) {
    return response;
  }

  response.push(
    `\n"${c.red(pkgName)}" is not valid package name.\nHere ${c.cyan('npm')} gives its reasons why:`
  );
  const { errors, warnngs } = validated;
  if (typeof errors !== 'undefined') {
    errors.forEach(err => response.push(c.red(` - ${err}`)));
  }

  if (typeof warnings !== 'undefined') {
    warnings.forEach(err => response.push(c.yellow(` - ${err}`)));
  }

  return response;
}

exports = module.exports = () => {
  const CWD = process.cwd();
  const ARGS = process.argv;
  const appName = ARGS.slice(2).shift();
  const cwdContent = fs.readdirSync(CWD, 'utf8');
  const cwdName = path.basename(CWD);

  const npmInitUser = execSync(
    'npm config get init.author.name',
    { encoding: 'utf8' }
  ).trim();

  const npmInitEmail = execSync(
    'npm config get init.author.email',
    { encoding: 'utf8' }
  ).trim();

  const author = npmInitUser !== 'undefined' ? `${ npmInitUser } <${ npmInitEmail }>` : undefined;

  return [{
    type: 'confirm',
    name: 'cwd',
    message: `Would you like to create a project in the current folder (${ cwdName })?`,
    default: true,
    when: answers => {
      if (appName) {
        const errors = validateName(appName);
        if (errors.length) {
          console.error(`Could not use '${ appName }' as the name of your project and it's folder name.`);
          console.error(errors.join('\n'));
        } else {
          answers.name = appName;
          return false;
        }
      } else if (cwdContent.length > 0) {
        return false;
      }

      return true;
    }
  }, {
    type: 'input',
    name: 'name',
    message: `Please, enter the name of the project you would like to create:`,
    default: 'my-app',
    validate: name => {
      const errors = validateName(name);
      if (errors.length === 0) {
        return true;
      }

      return errors.length === 0 || errors.join('\n');
    },
    when: answers => {
      if (answers.cwd) {
        const errors = validateName(cwdName);

        if (errors.length) {
          console.error('Could not use current folder name as name of your project.');
          console.error(errors.join('\n'));
        } else {
          answers.name = cwdName;
          return false;
        }
      } else if (answers.name) {
        console.log(`Using ${ c.cyan(answers.name) } as your project name`);
        return false;
      }

      return true;
    }
  }, {
    type: 'input',
    name: 'description',
    message: 'Please, provide your app description:\n',
    default: 'The BEST app ever created with KRA'
  }, {
    type: 'input',
    name: 'license',
    message: 'Please, provide your project\'s license:',
    default: 'UNLICENSED',
    validate: input => {
      const res = validatePkgLicense(input);

      return res.validForNewPackages
        || (res.errors.length > 0 && res.errors.join('\n'));
    }
  }, {
    type: 'input',
    name: 'author',
    message: 'Please, provide the name of the project author:\n',
    default: author || 'Cool Guy <cool.guy@github.com>'
  }];
};
