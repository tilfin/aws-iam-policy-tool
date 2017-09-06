'use strict';

const readline = require('readline');

module.exports = function(prompt) {
  return new Promise((resolve, _) => {
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt(prompt);
    rl.prompt();
    rl.on('line', (line) => {
      resolve(line.trim());
      rl.close();
    });
  });
}
