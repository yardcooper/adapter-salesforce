#!/usr/bin/env node

const fs = require('fs-extra');
const rl = require('readline-sync');
const execute = require('child_process').exec;

/**
 * This script will determine the type of integration test to run
 * based on input. If other information is needed, it will solicit
 * that input and then edit the integration test accordingly.
 */

let stub = true;
let host = 'replace.hostorip.here';
let username = 'username';
let password = 'password';
let protocol = 'http';
let port = 80;
let sslenable = false;
let sslinvalid = false;
const dstub = true;
const dhost = 'replace.hostorip.here';
const dusername = 'username';
const dpassword = 'password';
const dprotocol = 'http';
const dport = 80;
const dsslenable = false;
const dsslinvalid = false;

let stderror = false;
let running = false;

/**
 * Updates the integration test file with the proper vars
 */
function replaceTestVars(test) {
  if (!fs.existsSync(test)) {
    console.log(`Could not find ${test}`);
    return 'error';
  }

  let intTest = fs.readFileSync(test, 'utf8');

  // replace stub variable
  let sindex = intTest.indexOf('const stub');
  let eindex = intTest.indexOf(';', sindex);
  let replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const stub = ${stub};`);

  // replace host variable
  sindex = intTest.indexOf('const host');
  eindex = intTest.indexOf(';', sindex);
  replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const host = '${host}';`);

  // replace username variable
  sindex = intTest.indexOf('const username');
  eindex = intTest.indexOf(';', sindex);
  replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const username = '${username}';`);

  // replace password variable
  sindex = intTest.indexOf('const password');
  eindex = intTest.indexOf(';', sindex);
  replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const password = '${password}';`);

  // replace protocol variable
  sindex = intTest.indexOf('const protocol');
  eindex = intTest.indexOf(';', sindex);
  replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const protocol = '${protocol}';`);

  // replace port variable
  sindex = intTest.indexOf('const port');
  eindex = intTest.indexOf(';', sindex);
  replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const port = ${port};`);

  // replace sslenable variable
  sindex = intTest.indexOf('const sslenable');
  eindex = intTest.indexOf(';', sindex);
  replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const sslenable = ${sslenable};`);

  // replace sslinvalid variable
  sindex = intTest.indexOf('const sslinvalid');
  eindex = intTest.indexOf(';', sindex);
  replStr = intTest.substring(sindex, eindex + 1);
  intTest = intTest.replace(replStr, `const sslinvalid = ${sslinvalid};`);

  console.log(`Updates to ${test} complete`);
  fs.writeFileSync(test, intTest);
  return 'success';
}

/**
 * Updates the integration test file and runs the script
 */
function runTest(callback) {
  replaceTestVars('test/integration/adapterTestIntegration.js');

  const cmdPath = 'npm run test:integration';
  console.log('\nRUNNING INTEGRATION TESTS - THIS WILL TAKE SOME TIME AND WILL NOT PRINT UNTIL TEST IS COMPLETE!\n');
  return execute(cmdPath, (cerror, stdout, stderr) => {
    console.log('executed tests:\n');
    console.log(`${stdout}\n`);

    if (stderror) {
      console.log('\nstandard error from tests - unless test failed, these may be expected errors:\n');
      console.log(`${stderr}\n`);
    }

    if (cerror) {
      console.log('\nexec error:\n');
      console.log(`${cerror}\n`);
    }

    // reset the defaults
    stub = dstub;
    host = dhost;
    username = dusername;
    password = dpassword;
    protocol = dprotocol;
    port = dport;
    sslenable = dsslenable;
    sslinvalid = dsslinvalid;
    replaceTestVars('test/integration/adapterTestIntegration.js');
    return callback('done');
  });
}

/**
 * Updates the unit test file and runs the script
 */
function runUnitTest(callback) {
  const cmdPath = 'npm run test:unit';
  console.log('\nRUNNING UNIT TESTS - THIS WILL TAKE SOME TIME AND WILL NOT PRINT UNTIL TEST IS COMPLETE!\n');
  return execute(cmdPath, (cerror, stdout, stderr) => {
    console.log('executed tests:\n');
    console.log(`${stdout}\n`);

    if (stderror) {
      console.log('\nstandard error from tests - unless test failed, these may be expected errors:\n');
      console.log(`${stderr}\n`);
    }

    if (cerror) {
      console.log('\nexec error:\n');
      console.log(`${cerror}\n`);
    }

    return callback('done');
  });
}

// print process.argv
const args = process.argv.slice(2);

// go through the arguments that where provided
for (let a = 0; a < args.length; a += 1) {
  if (args[a].toUpperCase() === '-H' || args[a].toUpperCase() === '--HELP') {
    let message = '\nThis tool is used to make it easier to run integration tests.\n';
    message += '\n';
    message += 'Options:\n';
    message += '-h, --help: Prints this message\n';
    message += '-r, --reset: Resets the variables back to stub settings and removes credentials\n';
    message += '-s, --stderror: Displays the standard error from the run, this can have data even if all the tests pass\n';
    message += '-u, --unit: Runs just the unit tests as well\n';
    console.log(message);
    running = true;
  }

  if (args[a].toUpperCase() === '-R' || args[a].toUpperCase() === '--RESET') {
    running = true;
    replaceTestVars('test/integration/adapterTestIntegration.js');
    replaceTestVars('test/unit/adapterTestUnit.js');
    console.log('test reset complete');
  }
  if (args[a].toUpperCase() === '-S' || args[a].toUpperCase() === '--STDERROR') {
    stderror = true;
  }
  if (args[a].toUpperCase() === '-U' || args[a].toUpperCase() === '--UNIT') {
    running = true;
    runUnitTest((status) => {
      console.log(status);
      process.exit(1);
    });
  }
}

if (!running) {
  // how are we running the test?
  let answer = rl.question('\nDo you want to run the integration test integrated with the other system? (no): ');
  if (answer && (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')) {
    stub = false;
    console.log('Need more information about the integration!');
  } else {
    running = true;
    runTest((status) => {
      console.log(status);
      process.exit(1);
    });
  }

  if (!running) {
    // how are we running the test?
    answer = rl.question('\nWhat is the dns or ip of the system you want to test with? (localhost): ');
    if (answer) {
      host = answer;
    } else {
      host = 'localhost';
    }

    // need the username to authenticate with
    answer = rl.question('\nWhat is the username to authenticate, if no authentication just return? (username): ');
    if (answer) {
      username = answer;
    }

    // need the password to authenticate with
    answer = rl.question('\nWhat is the password to authenticate, if no authentication just return? (password): ', { hideEchoBack: true });
    if (answer) {
      password = answer;
    }

    // need the protocol used with other system
    answer = rl.question('\nWhat is the protocol used to communicate with the system? (http): ');
    if (answer) {
      protocol = answer;
    }

    if (protocol === 'https') {
      // need the port used with other system
      answer = rl.question('\nWhat is the port used to communicate with the system? (443): ');
      if (answer) {
        port = Number(answer);
      }

      // turn on ssl and accept invalid certs
      sslenable = true;
      sslinvalid = true;
      runTest((status) => {
        console.log(status);
        process.exit(1);
      });
    } else {
      // need the port used with other system
      answer = rl.question('\nWhat is the port used to communicate with the system? (80): ');
      if (answer) {
        port = Number(answer);
      }
      runTest((status) => {
        console.log(status);
        process.exit(1);
      });
    }
  }
}
