const fs = require('fs');
const semverSatisfies = require('semver/functions/satisfies');
const packageJson = require('../package.json');

try {
  // pattern supplied by semver.org via https://regex101.com/r/vkijKf/1/ but removed gm from end to only match a single semver
  // const semverPat = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  // pattern supplied by semver.org via https://regex101.com/r/Ly7O1x/3/ with following changes
  // removed P's from before capturing group names and
  // removed  gm from end to only match a single semver
  // const semverPat = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  const patches = (fs.existsSync('./patches')) ? fs.readdirSync('./patches', { withFileTypes: true }) : [];
  if (!patches.length) {
    console.error('\nno patches - nothing to do\n');
    process.exitCode = 1;
  }

  const dependencies = packageJson.dependencies || {};
  if (!Object.keys(dependencies).length) {
    console.error('\nno dependencies - nothing to do\n');
    process.exitCode = 1;
  }

  let changed = false;
  console.error('\nprocessing patches');
  const bundledDependencies = packageJson.bundledDependencies || packageJson.bundleDependencies || [];

  patches.forEach((patch) => {
    if (!patch.isFile()) {
      console.error(`${patch.name} skipped, is not a regular file`);
      return;
    }
    if (!patch.name.endsWith('.patch')) {
      console.error(`${patch.name} skipped, does not end with .patch`);
      return;
    }
    const splits = patch.name.slice(0, -6).split('+');
    if (splits.length > 4) {
      console.error(`${patch.name} skipped, does not follow the naming convention (cannot use '+' other than to separate scope/package/semver and at most once within semver)`);
      return;
    }
    const scope = splits[0][0] === '@' ? splits.shift() : null;
    const packageName = splits.shift();
    const semver = splits.join('+');
    // const { groups } = semver.match(semverPat);
    const file = scope ? `${scope}/${packageName}` : packageName;
    if (dependencies[file] && semverSatisfies(semver, dependencies[file])) {
      if (!bundledDependencies.includes(file)) {
        bundledDependencies.push(file);
        console.error(`added ${file} to bundledDependencies`);
        changed = true;
      } else {
        console.error(`bundledDependencies already has ${file}`);
      }
    } else {
      const depmsg = dependencies[file] ? `version mismatch (${dependencies[file]}) in dependencies` : 'not found in dependencies';
      console.error(`patch ${patch.name} ${depmsg}`);
    }
  });

  if (!packageJson.bundledDependencies && bundledDependencies.length) {
    delete packageJson.bundleDependencies;
    packageJson.bundledDependencies = bundledDependencies;
    console.error('renaming bundleDependencies to bundledDependencies');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync('./package.json.new', JSON.stringify(packageJson, null, 2));
    console.error('wrote package.json.new');
    fs.renameSync('./package.json', './package.json.old');
    console.error('moved package.json to package.json.old');
    fs.renameSync('./package.json.new', './package.json');
    console.error('moved package.json.new to package.json');
  } else {
    console.error('no changes\n');
    process.exitCode = 1;
  }
} catch (e) {
  if (e) {
    // caught error, exit with status 2 to signify abject failure
    console.error(`\ncaught exception - ${e}\n`);
    process.exitCode = 2;
  } else {
    // caught false, exit with status 1 to signify nothing done
    process.exitCode = 1;
  }
} finally {
  console.error('done\n');
}
