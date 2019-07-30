#!/usr/bin/env node
/* @copyright Itential, LLC 2019 */

const fs = require('fs-extra');
const path = require('path');

async function createBundle(adapterOldDir) {
  // set directories
  const artifactDir = path.join(adapterOldDir, '../artifactTemp');
  const workflowsDir = path.join(adapterOldDir, 'workflows');

  // read adapter's package and set names
  const adapterPackage = fs.readJSONSync(path.join(adapterOldDir, 'package.json'));
  const originalName = adapterPackage.name.substring(adapterPackage.name.lastIndexOf('/') + 1);
  const shortenedName = originalName.replace('adapter-', '');
  const artifactName = originalName.replace('adapter', 'bundled-adapter');


  const adapterNewDir = path.join(artifactDir, 'bundles', 'adapters', originalName);
  fs.ensureDirSync(adapterNewDir);

  const ops = [];

  // copy old adapterDir to bundled hierarchy location
  ops.push(() => fs.copySync(adapterOldDir, adapterNewDir));

  // copy readme
  ops.push(() => fs.copySync(path.join(adapterOldDir, 'README.md'), path.join(artifactDir, 'README.md')));

  // copy changelog
  ops.push(() => fs.copySync(path.join(adapterOldDir, 'CHANGELOG.md'), path.join(artifactDir, 'CHANGELOG.md')));

  // copy license
  ops.push(() => fs.copySync(path.join(adapterOldDir, 'LICENSE'), path.join(artifactDir, 'LICENSE')));

  // create package
  const artifactPackage = {
    name: artifactName,
    version: adapterPackage.version,
    description: `A bundled version of the ${originalName} to be used in adapter-artifacts for easy installation`,
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
      deploy: 'npm publish --registry=http://registry.npmjs.org'
    },
    keywords: [
      'IAP',
      'artifacts',
      'Itential',
      'Pronghorn',
      'Adapter',
      'Adapter-Artifacts',
      shortenedName
    ],
    author: 'Itential Artifacts',
    license: 'Apache-2.0',
    repository: adapterPackage.repository,
    private: false,
    devDependencies: {
      r2: '^2.0.1',
      ajv: '6.10.0',
      'better-ajv-errors': '^0.6.1',
      'fs-extra': '^7.0.1'
    }
  };

  ops.push(() => fs.writeJSONSync(path.join(artifactDir, 'package.json'), artifactPackage, { spaces: 2 }));

  // create manifest
  const manifest = {
    bundleName: originalName,
    version: adapterPackage.version,
    fingerprint: 'Some verifiable token',
    createdEpoch: '1554836984020',
    artifacts: [
      {
        id: `${shortenedName}-adapter`,
        name: `${shortenedName}-adapter`,
        type: 'adapter',
        location: `/bundles/adapters/${originalName}`,
        description: artifactPackage.description,
        properties: {
          entryPoint: false
        }
      }
    ]
  };

  // add workflows into artifact
  if (fs.existsSync(workflowsDir)) {
    const workflowFileNames = fs.readdirSync(workflowsDir);

    // if folder isnt empty and only file is not readme
    if (workflowFileNames.length !== 0 && (!(workflowFileNames.length === 1 && workflowFileNames[0].split('.')[1] === 'md'))) {
      // add workflows to correct location in bundle
      ops.push(() => fs.copySync(workflowsDir, path.join(artifactDir, 'bundles', 'workflows')));

      // add workflows to manifest
      workflowFileNames.forEach((filename) => {
        const [filenameNoExt, ext] = filename.split('.');
        if (ext === 'json') {
          manifest.artifacts.push({
            id: `workflow-${filenameNoExt}`,
            name: filenameNoExt,
            type: 'workflow',
            location: `/bundles/workflows/${filename}`,
            description: 'Main entry point to artifact',
            properties: {
              entryPoint: false
            }
          });
        }
      });
    }
  }

  ops.push(() => fs.writeJSONSync(path.join(artifactDir, 'manifest.json'), manifest, { spaces: 2 }));

  // Run the commands in parallel
  try {
    await Promise.all(ops.map(async op => op()));
  } catch (e) {
    throw new Error(e);
  }

  const pathObj = {
    bundlePath: artifactDir,
    bundledAdapterPath: path.join(artifactDir, 'bundles', 'adapters', originalName)
  };
  return pathObj;
}

async function artifactize(entryPathToAdapter) {
  try {
    const truePath = path.resolve(entryPathToAdapter);
    const packagePath = path.join(truePath, 'package');
    // remove adapter from package and move bundle in
    const pathObj = await createBundle(packagePath);
    const { bundlePath } = pathObj;
    fs.removeSync(packagePath);
    fs.moveSync(bundlePath, packagePath);
    return 'Bundle successfully created and old folder system removed';
  } catch (e) {
    throw e;
  }
}

module.exports = { createBundle, artifactize };
