/* @copyright Itential, LLC 2020 */

/* global describe context before after */
/* eslint global-require: warn */
/* eslint no-unused-vars: warn */
/* eslint import/no-extraneous-dependencies: warn */
/* eslint import/no-dynamic-require: warn */
/* eslint import/no-unresolved: warn */

const mocha = require('mocha');
const path = require('path');
const assert = require('assert');
const itParam = require('mocha-param');

const utils = require('../../utils/tbUtils');
const basicGet = require('../../utils/basicGet');
const { name } = require('../../package.json');
const { methods } = require('../../pronghorn.json');

const getPronghornProps = (iapDir) => {
  const { Discovery } = require('@itential/itential-utils');
  console.log('Retrieving properties.json file...');
  const rawProps = require(path.join(iapDir, 'properties.json'));
  console.log('Decrypting properties...');
  const discovery = new Discovery();
  const pronghornProps = utils.decryptProperties(rawProps, path.join(__dirname, '..'), discovery);
  console.log('Found properties.\n');
  return pronghornProps;
};

let a;

describe('[integration] Adapter BasicGET Test', () => {
  context('Testing GET calls without query parameters', () => {
    before(async () => {
      const iapDir = path.join(__dirname, '../../../../../');
      if (!utils.areWeUnderIAPinstallationDirectory()) {
        const sampleProperties = require('../../sampleProperties.json');
        const adapter = { properties: sampleProperties };
        a = basicGet.getAdapterInstance(adapter);
      } else {
        const pronghornProps = getPronghornProps(iapDir);
        console.log('Connecting to Database...');
        const database = await basicGet.connect(pronghornProps);
        console.log('Connection established.');
        const adapter = await database.collection(utils.SERVICE_CONFIGS_COLLECTION).findOne(
          { model: name }
        );
        a = basicGet.getAdapterInstance(adapter);
      }
    });

    after((done) => {
      done();
    });

    const basicGets = methods.filter((method) => (method.route.verb === 'GET' && method.input.length === 0));
    if (basicGets.length === 0) {
      console.log('No non-parameter GET calls found.');
      process.exit(0);
    }
    const functionNames = basicGets.map((g) => g.name);
    const request = function request(f, ad) {
      return new Promise((resolve, reject) => {
        const getRespCode = (resp) => {
          if (resp) {
            if (resp.metrics.code !== 200) {
              console.log('\x1b[31m', `Testing ${f} \nResponseCode: ${resp.metrics.code}`);
            }
            resolve(resp.metrics.code);
          } else {
            console.log('\x1b[31m', `call ${f} results in failure`);
            reject(new Error(`${f} failed`));
          }
        };
        ad[f](getRespCode, console.log);
      });
    };

    itParam('GET call should return 200', functionNames, (fname) => {
      console.log(`\t ${fname}`);
      return request(fname, a).then((result) => assert.equal(result, 200));
    });
  });
});
