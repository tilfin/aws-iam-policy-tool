'use strict';

const readline = require('readline');

module.exports = function(prompt) {
  return new Promise((resolve, _) => {
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt(`\x1b[1m${prompt}\x1b[0m`);
    rl.prompt();
    rl.on('line', (line) => {
      resolve(line.trim());
      rl.close();
    });
  });
}
