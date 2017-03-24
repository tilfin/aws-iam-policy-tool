'use strict';

const fs = require('fs');
const path = require('path');

exports.listJsonFilesPromise = function listJsonFilesPromise(parentDir) {
  return new Promise(function(resolve, reject){
      fs.readdir(parentDir, function(err, files){
          if (err) {
            reject(err);
            return;
          }

          const fileList = files.map(function(file){
            return path.resolve(parentDir, file);
          }).filter(function(file){
            return fs.statSync(file).isFile() && /.*\.json$/.test(file);
          });
          resolve(fileList);
        });
    });
}

exports.readFilePromise = function readFilePromise(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, text) => {
      if (err) reject(err);
      else resolve(text);
    });
  });
}

exports.writeFilePromise = function writeFilePromise(filePath, text) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, text, function(err) {
      if (err) reject(err)
      else resolve();
    });
  });
}
