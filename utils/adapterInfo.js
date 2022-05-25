#!/usr/bin/env node
/* @copyright Itential, LLC 2019 */
/* eslint global-require:warn */
/* eslint import/no-dynamic-require:warn */
/* eslint prefer-destructuring:warn */

const fs = require('fs-extra');
const path = require('path');

/**
 * This script will determine the information about the adapter and store
 * it into a file in the adapter.
 */

/**
 * get adapter information
 */
function adapterInfo() {
  // set the base pase of the adapter - tool shoud be one level up in utils
  let adaptdir = __dirname;
  const infoRes = {};

  if (adaptdir.endsWith('/utils')) {
    adaptdir = adaptdir.substring(0, adaptdir.length - 6);
  }
  const pack = require(`${adaptdir}/package.json`);
  infoRes.version = pack.version;

  let configCount = 0;
  if (fs.existsSync(`${adaptdir}/pronghorn.json`)) {
    const cFile = fs.readFileSync(`${adaptdir}/pronghorn.json`, 'utf8');
    configCount += cFile.split('\n').length;
  } else {
    console.log('Missing - pronghorn.json');
  }
  if (fs.existsSync(`${adaptdir}/propertiesSchema.json`)) {
    const cFile = fs.readFileSync(`${adaptdir}/propertiesSchema.json`, 'utf8');
    configCount += cFile.split('\n').length;
  } else {
    console.log('Missing - propertiesSchema.json');
  }
  if (fs.existsSync(`${adaptdir}/error.json`)) {
    const cFile = fs.readFileSync(`${adaptdir}/error.json`, 'utf8');
    configCount += cFile.split('\n').length;
  } else {
    console.log('Missing - error.json');
  }
  const entitydir = path.join(adaptdir, '/entities');
  if (fs.existsSync(entitydir) && fs.statSync(entitydir).isDirectory()) {
    const entities = fs.readdirSync(entitydir);
    // need to go through each entity in the entities directory
    for (let e = 0; e < entities.length; e += 1) {
      if (fs.statSync(`${entitydir}/${entities[e]}`).isDirectory()) {
        const cfiles = fs.readdirSync(entitydir);
        for (let c = 0; c < cfiles.length; c += 1) {
          if (cfiles[c].endsWith('.json')) {
            const ccFile = fs.readFileSync(`${entitydir}/${entities[e]}/${cfiles[c]}`, 'utf8');
            configCount += ccFile.split('\n').length;
          }
        }
      }
    }
  } else {
    console.log('Could not find the entities directory');
  }
  infoRes.configLines = configCount;

  let scodeCount = 0;
  if (fs.existsSync(`${adaptdir}/utils/artifactize.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/artifactize.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/artifactize.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/basicGet.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/basicGet.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/basicGet.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/checkMigrate.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/checkMigrate.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/checkMigrate.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/findPath.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/findPath.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/findPath.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/modify.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/modify.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/modify.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/packModificationScript.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/packModificationScript.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/packModificationScript.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/setup.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/setup.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/setup.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/tbScript.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/tbScript.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/tbScript.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/tbUtils.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/tbUtils.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/tbUtils.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/testRunner.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/testRunner.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/testRunner.js');
  }
  if (fs.existsSync(`${adaptdir}/utils/troubleshootingAdapter.js`)) {
    const sFile = fs.readFileSync(`${adaptdir}/utils/troubleshootingAdapter.js`, 'utf8');
    scodeCount += sFile.split('\n').length;
  } else {
    console.log('Missing - utils/troubleshootingAdapter.js');
  }
  infoRes.scriptLines = scodeCount;

  let codeCount = 0;
  if (fs.existsSync(`${adaptdir}/adapter.js`)) {
    const aFile = fs.readFileSync(`${adaptdir}/adapter.js`, 'utf8');
    codeCount += aFile.split('\n').length;
  } else {
    console.log('Missing - utils/adapter.js');
  }
  if (fs.existsSync(`${adaptdir}/adapterBase.js`)) {
    const aFile = fs.readFileSync(`${adaptdir}/adapterBase.js`, 'utf8');
    codeCount += aFile.split('\n').length;
  } else {
    console.log('Missing - utils/adapterBase.js');
  }
  infoRes.codeLines = codeCount;

  let tcodeCount = 0;
  let ttestCount = 0;
  if (fs.existsSync(`${adaptdir}/test/integration/adapterTestBasicGet.js`)) {
    const tFile = fs.readFileSync(`${adaptdir}/test/integration/adapterTestBasicGet.js`, 'utf8');
    tcodeCount += tFile.split('\n').length;
    ttestCount += tFile.split('it(\'').length;
  } else {
    console.log('Missing - test/integration/adapterTestBasicGet.js');
  }
  if (fs.existsSync(`${adaptdir}/test/integration/adapterTestConnectivity.js`)) {
    const tFile = fs.readFileSync(`${adaptdir}/test/integration/adapterTestConnectivity.js`, 'utf8');
    tcodeCount += tFile.split('\n').length;
    ttestCount += tFile.split('it(\'').length;
  } else {
    console.log('Missing - test/integration/adapterTestConnectivity.js');
  }
  if (fs.existsSync(`${adaptdir}/test/integration/adapterTestIntegration.js`)) {
    const tFile = fs.readFileSync(`${adaptdir}/test/integration/adapterTestIntegration.js`, 'utf8');
    tcodeCount += tFile.split('\n').length;
    ttestCount += tFile.split('it(\'').length;
  } else {
    console.log('Missing - test/integration/adapterTestIntegration.js');
  }
  if (fs.existsSync(`${adaptdir}/test/unit/adapterBaseTestUnit.js`)) {
    const tFile = fs.readFileSync(`${adaptdir}/test/unit/adapterBaseTestUnit.js`, 'utf8');
    tcodeCount += tFile.split('\n').length;
    ttestCount += tFile.split('it(\'').length;
  } else {
    console.log('Missing - test/unit/adapterBaseTestUnit.js');
  }
  if (fs.existsSync(`${adaptdir}/test/unit/adapterTestUnit.js`)) {
    const tFile = fs.readFileSync(`${adaptdir}/test/unit/adapterTestUnit.js`, 'utf8');
    tcodeCount += tFile.split('\n').length;
    ttestCount += tFile.split('it(\'').length;
  } else {
    console.log('Missing - test/unit/adapterTestUnit.js');
  }
  infoRes.testLines = tcodeCount;
  infoRes.testCases = ttestCount;
  infoRes.totalCodeLines = scodeCount + codeCount + tcodeCount;

  if (fs.existsSync(`${adaptdir}/pronghorn.json`)) {
    // Read the entity schema from the file system
    const phFile = path.join(adaptdir, '/pronghorn.json');
    const prong = require(phFile);
    infoRes.wfTasks = prong.methods.length;
  } else {
    console.log('Missing - pronghorn.json');
  }

  console.log(JSON.stringify(infoRes));
  fs.writeFileSync(`${adaptdir}/report/adapterInfo.json`, JSON.stringify(infoRes, null, 2));
}

adapterInfo();
