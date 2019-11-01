'use strict';
const path = require('path');

const listAll = (dirPath = '/', fs) => {
  const allContent = fs.readdirSync(dirPath, {
    encoding: 'utf8'
  });

  return allContent.reduce((files, file) => {
    const fullName = path.join(dirPath, file);
    const fileStat = fs.statSync(fullName);
    if (fileStat.isDirectory()) {
      files = files.concat(listAll(fullName, fs));
    } else if (fileStat.isFile()) {
      files.push(fullName);
    }
    return files;
  }, []);
};

module.exports = listAll;
