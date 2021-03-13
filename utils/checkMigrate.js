const { execSync } = require('child_process');
const semver = require('semver');
const axios = require('axios');
const fs = require('fs');
const packageJson = require('../package.json');

const localEngineVer = packageJson.engineVersion;
const localUtils = execSync('npm list @itentialopensource/adapter-utils', { encoding: 'utf-8' });
const localUtilsVer = localUtils.split('@').pop().replace(/(\r\n|\n|\r| )/gm, '');

/**
 * @summary Makes a GET call using axios
 *
 * @function get
 * @param {String} url - url to make the call to
 */
function get(url) {
  const config = {
    method: 'get',
    url
  };
  return axios(config);
}

/**
 * @summary Checks if adapter can be migrated using migration package
 *
 * @function migratePossible
 */
function migratePossible() {
  const adapterTestUnit = fs.readFileSync('./test/unit/adapterTestUnit.js', { encoding: 'utf-8' });
  const readme = fs.readFileSync('./README.md', { encoding: 'utf-8' });
  return packageJson.keywords !== null && adapterTestUnit.indexOf('DO NOT REMOVE THIS COMMENT BLOCK') !== -1
  && readme.indexOf('available at ') !== -1 && readme.indexOf('You will need to change the credentials and possibly the host information below.') !== -1;
}

/**
 * @summary Checks if adapter is up-to-date or if migration is needed
 *
 * @function migrateNeeded
 */
async function migrateNeeded() {
  const engineUrl = 'https://adapters.itential.io/engineVersion';
  const utilsUrl = 'https://registry.npmjs.org/@itentialopensource/adapter-utils';
  const latestEngineVer = (await get(engineUrl)).data;
  const latestUtilsVer = (await get(utilsUrl)).data['dist-tags'].latest;
  return semver.lt(localEngineVer, latestEngineVer) || semver.lt(localUtilsVer, latestUtilsVer);
}

// Main Script
if (migratePossible()) {
  migrateNeeded().then((needed) => {
    if (needed) {
      console.log('Migration is needed and possible -- go to dev site to download migration package');
    } else {
      console.log('Migration is possible but not needed at the current time.');
    }
  }).catch((error) => {
    console.log('Could not get latest engine or utils version.', error.message);
  });
} else {
  console.log('Migration is not possible. Please contact Itential support for assistance');
}
