const fs = require('fs-extra');
const Ajv = require('ajv');
const rls = require('readline-sync');
const { execSync } = require('child_process');
const { existsSync } = require('fs-extra');
const { getAdapterConfig } = require('./tbUtils');
const { name } = require('../package.json');
const propertiesSchema = require('../propertiesSchema.json');

const flags = process.argv[2];

/**
 * @summary Updates database instance with new adapter properties
 *
 * @function updateServiceItem
 */
async function updateServiceItem() {
  const { database, serviceItem } = await getAdapterConfig();
  const currentProps = serviceItem.properties.properties;
  const ajv = new Ajv({ allErrors: true, useDefaults: true });
  const validate = ajv.compile(propertiesSchema);
  validate(currentProps);
  console.log('Updating Properties...');
  await database.collection('service_configs').updateOne(
    { model: name }, { $set: serviceItem }
  );
  console.log('Properties Updated');
}

/**
 * @summary Creates a backup zip file of current adapter
 *
 * @function backup
 */
function backup() {
  // zip all files except node_modules and package-lock
  const backupCmd = 'zip -r previousVersion.zip .';
  execSync(backupCmd, { encoding: 'utf-8' });
}

/**
 * @summary Archives previous modifications and removes the modification package
 *
 * @function archiveMod
 * @param {String} modType - update(UPD) or migrate(MIG)
 */
function archiveMod(modType) {
  if (!existsSync('./adapter_modifications/archive')) {
    execSync('mkdir ./adapter_modifications/archive');
  }
  const zipFile = modType === 'UPD' ? 'updatePackage.zip' : 'migrationPackage.zip';
  const now = new Date();
  const archiveName = `${modType}-${now.toISOString()}`;
  execSync(`mkdir adapter_modifications/archive/${archiveName}`);
  const archiveCmd = 'mv adapter_modifications/archive .'
  + ` && mv adapter_modifications/* archive/${archiveName}`
  + ' && mv archive adapter_modifications'
  + ` && rm ${zipFile}`;
  execSync(archiveCmd, { encoding: 'utf-8' });
}

/**
 * @summary Reverts modifications using backup zip file
 *
 * @function revertMod
 */
function revertMod() {
  const files = fs.readdirSync('./');
  // remove all files except previousVersion
  files.forEach((file) => {
    if (file !== 'previousVersion.zip') {
      fs.removeSync(file);
    }
  });
  // // unzip previousVersion, reinstall dependencies and delete zipfile
  execSync('unzip -o previousVersion.zip && rm -rf node_modules && rm package-lock.json && npm install');
  execSync('rm previousVersion.zip');
  console.log('Changes have been reverted');
}

// Main Script

// Migrate
if (flags === '-m') {
  if (!fs.existsSync('migrationPackage.zip')) {
    console.log('Migration Package not found. Download and place migrationPackage in the adapter root directory');
    process.exit();
  }
  // Backup current adapter
  backup();
  console.log('Migrating adapter and running tests...');
  const migrateCmd = 'unzip -o migrationPackage.zip'
  + ' && cd adapter_modifications'
  + ' && node migrate';
  const migrateOutput = execSync(migrateCmd, { encoding: 'utf-8' });
  console.log(migrateOutput);
  if (migrateOutput.indexOf('Lint exited with code 1') >= 0
  || migrateOutput.indexOf('Tests exited with code 1') >= 0) {
    if (rls.keyInYN('Adapter failed tests or lint after migrating. Would you like to revert the changes?')) {
      console.log('Reverting changes...');
      revertMod();
      process.exit();
    }
    console.log('Adapter Migration will continue. If you want to revert the changes, run the command npm run adapter:revert');
  }
  console.log('Installing new dependencies..');
  const updatePackageCmd = 'rm -rf node_modules && rm package-lock.json && npm install';
  const updatePackageOutput = execSync(updatePackageCmd, { encoding: 'utf-8' });
  console.log(updatePackageOutput);
  console.log('New dependencies installed');
  console.log('Updating adapter properties..');
  updateServiceItem().then(() => {
    console.log('Adapter Successfully Migrated. Restart adapter in IAP to apply the changes');
    archiveMod('MIG');
    process.exit();
  });
}

// Update
if (flags === '-u') {
  if (!fs.existsSync('updatePackage.zip')) {
    console.log('Update Package not found. Download and place updateAdapter.zip in the adapter root directory');
    process.exit();
  }
  // Backup current adapter
  backup();
  const updateCmd = 'unzip -o updatePackage.zip'
  + ' && cd adapter_modifications'
  + ' && node update.js updateFiles';
  execSync(updateCmd, { encoding: 'utf-8' });
  const updateOutput = execSync(updateCmd, { encoding: 'utf-8' });
  if (updateOutput.indexOf('Lint exited with code 1') >= 0
  || updateOutput.indexOf('Tests exited with code 1') >= 0) {
    if (rls.keyInYN('Adapter failed tests or lint after updating. Would you like to revert the changes?')) {
      console.log('Reverting changes...');
      revertMod();
      process.exit();
    }
    console.log('Adapter Update will continue. If you want to revert the changes, run the command npm run adapter:revert');
  }
  console.log(updateOutput);
  console.log('Adapter Successfully Updated. Restart adapter in IAP to apply the changes');
  archiveMod('UPD');
  process.exit();
}

// Revert
if (flags === '-r') {
  if (!fs.existsSync('previousVersion.zip')) {
    console.log('Previous adapter version not found. There are no changes to revert');
    process.exit();
  }
  revertMod();
}
