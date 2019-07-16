#!/usr/bin/env node
/* @copyright Itential, LLC 2019 */

const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');
const { createBundle } = require('./artifactize.js');

const nodeEntryPath = path.resolve('.');
createBundle(nodeEntryPath).then((pathObj) => {
  const { bundlePath, bundledAdapterPath } = pathObj;
  const npmIgnorePath = path.join(bundledAdapterPath, '.npmignore');
  const adapterPackagePath = path.join(bundledAdapterPath, 'package.json');
  const artifactPackagePath = path.join(bundlePath, 'package.json');

  // remove node_modules from .npmIgnore so that node_modules are included in the resulting tar from npm pack
  let npmIgnoreString;
  if (fs.existsSync(npmIgnorePath)) {
    npmIgnoreString = fs.readFileSync(npmIgnorePath, 'utf8');
    npmIgnoreString = npmIgnoreString.replace('node_modules', '');
    npmIgnoreString = npmIgnoreString.replace('\n\n', '\n');
    fs.writeFileSync(npmIgnorePath, npmIgnoreString);
  }

  // add files to package so that node_modules are included in the resulting tar from npm pack
  const adapterPackage = fs.readJSONSync(adapterPackagePath);
  adapterPackage.files = ['*'];
  fs.writeJSONSync(artifactPackagePath, adapterPackage, { spaces: 2 });
  const npmResult = spawnSync('npm', ['pack', '-q', bundlePath], { cwd: path.resolve(bundlePath, '..') });
  if (npmResult.status === 0) {
    fs.removeSync(bundlePath);
    console.log('Bundle folder removed');
  }
  console.log('Script successful');
});
