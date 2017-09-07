'use strict';

const fs = require('fs');
const path = require('path');

exports.listJsonFiles = function listJsonFiles(parentDir) {
  return new Promise((resolve, reject) => {
      fs.readdir(parentDir, (err, files) => {
          if (err) {
            reject(err);
            return;
          }

          const fileList = files.map(file => {
            return path.resolve(parentDir, file);
          }).filter(file => {
            return fs.statSync(file).isFile() && /.*\.json$/.test(file);
          });
          resolve(fileList);
        });
    });
}

exports.readFile = function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, text) => {
      if (err) reject(err);
      else resolve(text);
    });
  });
}

exports.writeJSONFile = function writeJSONFile(dir, fileName, content) {
  const filePath = path.join(dir, fileName);
  const json = JSON.stringify(content, null, 4);
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, json, function(err) {
      if (err) reject(err)
      else resolve();
    });
  });
}
