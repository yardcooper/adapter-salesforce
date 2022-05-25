const fs = require('fs');

/**
 * This script will uninstall pre-commit or pre-push hooks in case there's ever a need to
 * commit/push something that has issues
 */

const precommitPath = '.git/hooks/pre-commit';
const prepushPath = '.git/hooks/pre-push';
fs.unlink(precommitPath, (err) => {
  if (err && err.code !== 'ENOENT') {
    console.log(`${err.message}`);
  }
});

fs.unlink(prepushPath, (err) => {
  if (err && err.code !== 'ENOENT') {
    console.log(`${err.message}`);
  }
});
