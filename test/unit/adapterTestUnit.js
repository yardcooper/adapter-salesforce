// Set globals
/* global describe it log pronghornProps */
/* eslint global-require:warn */

// include required items for testing & logging
const assert = require('assert');
const fs = require('fs-extra');
const winston = require('winston');
const path = require('path');
const execute = require('child_process').execSync;

// stub and attemptTimeout are used throughout the code so set them here
let logLevel = 'none';
const stub = true;
const attemptTimeout = 5000;

// these variables can be changed to run in integrated mode so easier to set them here
// always check these in with bogus data!!!
const host = 'replace.hostorip.here';
const username = 'username';
const password = 'password';
const protocol = 'http';
const port = 80;
const sslenable = false;
const sslinvalid = false;

// these are the adapter properties. You generally should not need to alter
// any of these after they are initially set up
global.pronghornProps = {
  pathProps: {
    encrypted: false
  },
  adapterProps: {
    adapters: [{
      id: 'Test-salesforce',
      type: 'Salesforce',
      properties: {
        host,
        port,
        base_path: '//api',
        version: 'v1',
        cache_location: 'none',
        protocol,
        stub,
        authentication: {
          auth_method: 'request_token',
          username,
          password,
          token: '',
          token_timeout: 1800000,
          token_cache: 'local',
          invalid_token_error: 401,
          auth_field: 'header.headers.X-AUTH-TOKEN',
          auth_field_format: '{token}'
        },
        healthcheck: {
          type: 'startup',
          frequency: 60000
        },
        throttle: {
          throttle_enabled: false,
          number_pronghorns: 1,
          sync_async: 'sync',
          max_in_queue: 1000,
          concurrent_max: 1,
          expire_timeout: 0,
          avg_runtime: 200
        },
        request: {
          number_retries: 3,
          limit_retry_error: 0,
          failover_codes: [],
          attempt_timeout: attemptTimeout,
          healthcheck_on_timeout: true,
          archiving: false
        },
        proxy: {
          enabled: false,
          host: '',
          port: 1,
          protocol: 'http'
        },
        ssl: {
          ecdhCurve: '',
          enabled: sslenable,
          accept_invalid_cert: sslinvalid,
          ca_file: '',
          secure_protocol: '',
          ciphers: ''
        }
      }
    }]
  }
};

global.$HOME = `${__dirname}/../..`;

// set the log levels that Pronghorn uses, spam and trace are not defaulted in so without
// this you may error on log.trace calls.
const myCustomLevels = {
  levels: {
    spam: 6,
    trace: 5,
    debug: 4,
    info: 3,
    warn: 2,
    error: 1,
    none: 0
  }
};

// need to see if there is a log level passed in
process.argv.forEach((val) => {
  // is there a log level defined to be passed in?
  if (val.indexOf('--LOG') === 0) {
    // get the desired log level
    const inputVal = val.split('=')[1];

    // validate the log level is supported, if so set it
    if (Object.hasOwnProperty.call(myCustomLevels.levels, inputVal)) {
      logLevel = inputVal;
    }
  }
});

// need to set global logging
global.log = new (winston.Logger)({
  level: logLevel,
  levels: myCustomLevels.levels,
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Runs the error asserts for the test
 */
function runErrorAsserts(data, error, code, origin, displayStr) {
  assert.equal(null, data);
  assert.notEqual(undefined, error);
  assert.notEqual(null, error);
  assert.notEqual(undefined, error.IAPerror);
  assert.notEqual(null, error.IAPerror);
  assert.notEqual(undefined, error.IAPerror.displayString);
  assert.notEqual(null, error.IAPerror.displayString);
  assert.equal(code, error.icode);
  assert.equal(origin, error.IAPerror.origin);
  assert.equal(displayStr, error.IAPerror.displayString);
}


// require the adapter that we are going to be using
const Salesforce = require('../../adapter.js');

// delete the .DS_Store directory in entities -- otherwise this will cause errors
const dirPath = path.join(__dirname, '../../entities/.DS_Store');
if (fs.existsSync(dirPath)) {
  try {
    fs.removeSync(dirPath);
    console.log('.DS_Store deleted');
  } catch (e) {
    console.log('Error when deleting .DS_Store:', e);
  }
}

// begin the testing - these should be pretty well defined between the describe and the it!
describe('[unit] Salesforce Adapter Test', () => {
  describe('Salesforce Class Tests', () => {
    const a = new Salesforce(
      pronghornProps.adapterProps.adapters[0].id,
      pronghornProps.adapterProps.adapters[0].properties
    );

    describe('#class instance created', () => {
      it('should be a class with properties', (done) => {
        assert.notEqual(null, a);
        assert.notEqual(undefined, a);
        assert.notEqual(null, a.allProps);
        const check = global.pronghornProps.adapterProps.adapters[0].properties.healthcheck.type;
        assert.equal(check, a.healthcheckType);
        done();
      }).timeout(attemptTimeout);
    });

    describe('adapterBase.js', () => {
      it('should have an adapterBase.js', (done) => {
        fs.exists('adapterBase.js', (val) => {
          assert.equal(true, val);
          done();
        });
      });
    });

    let wffunctions = [];
    describe('#getWorkflowFunctions', () => {
      it('should retrieve workflow functions', (done) => {
        const p = new Promise((resolve) => {
          wffunctions = a.getWorkflowFunctions();
          resolve();
          assert.notEqual(0, wffunctions.length);
          done();
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('package.json', () => {
      it('should have a package.json', (done) => {
        fs.exists('package.json', (val) => {
          assert.equal(true, val);
          done();
        });
      });
      it('package.json should be customized', (done) => {
        const packageDotJson = require('../../package.json');
        assert.notEqual(-1, packageDotJson.name.indexOf('salesforce'));
        assert.notEqual(undefined, packageDotJson.version);
        assert.notEqual(null, packageDotJson.version);
        assert.notEqual('', packageDotJson.version);
        done();
      });
    });

    describe('pronghorn.json', () => {
      it('should have a pronghorn.json', (done) => {
        fs.exists('pronghorn.json', (val) => {
          assert.equal(true, val);
          done();
        });
      });
      it('pronghorn.json should be customized', (done) => {
        const pronghornDotJson = require('../../pronghorn.json');
        assert.notEqual(-1, pronghornDotJson.id.indexOf('salesforce'));
        assert.equal('Salesforce', pronghornDotJson.export);
        assert.equal('Salesforce', pronghornDotJson.displayName);
        assert.equal('Salesforce', pronghornDotJson.title);
        done();
      });
      it('pronghorn.json should only expose workflow functions', (done) => {
        const pronghornDotJson = require('../../pronghorn.json');

        for (let m = 0; m < pronghornDotJson.methods.length; m += 1) {
          let found = false;
          let paramissue = false;

          for (let w = 0; w < wffunctions.length; w += 1) {
            if (pronghornDotJson.methods[m].name === wffunctions[w]) {
              found = true;
              const methLine = execute(`grep "${wffunctions[w]}(" adapter.js | grep "{"`).toString();
              let wfparams = [];

              if (methLine.indexOf('(') >= 0 && methLine.indexOf(')') >= 0) {
                const temp = methLine.substring(methLine.indexOf('(') + 1, methLine.indexOf(')'));
                wfparams = temp.split(',');

                for (let t = 0; t < wfparams.length; t += 1) {
                  wfparams[t] = wfparams[t].trim();

                  if (wfparams[t] === 'callback') {
                    wfparams.splice(t, 1);
                  }
                }
              }

              // if there are inputs defined but not on the method line
              if (wfparams.length === 0 && (pronghornDotJson.methods[m].input
                  && pronghornDotJson.methods[m].input.length > 0)) {
                paramissue = true;
              } else if (wfparams.length > 0 && (!pronghornDotJson.methods[m].input
                  || pronghornDotJson.methods[m].input.length === 0)) {
                // if there are no inputs defined but there are on the method line
                paramissue = true;
              } else {
                for (let p = 0; p < pronghornDotJson.methods[m].input.length; p += 1) {
                  let pfound = false;
                  for (let wfp = 0; wfp < wfparams.length; wfp += 1) {
                    if (pronghornDotJson.methods[m].input[p].name === wfparams[wfp]) {
                      pfound = true;
                    }
                  }

                  if (!pfound) {
                    paramissue = true;
                  }
                }
                for (let wfp = 0; wfp < wfparams.length; wfp += 1) {
                  let pfound = false;
                  for (let p = 0; p < pronghornDotJson.methods[m].input.length; p += 1) {
                    if (pronghornDotJson.methods[m].input[p].name === wfparams[wfp]) {
                      pfound = true;
                    }
                  }

                  if (!pfound) {
                    paramissue = true;
                  }
                }
              }

              break;
            }
          }

          if (!found) {
            // this is the reason to go through both loops - log which ones are not found so
            // they can be worked
            log.error(`${pronghornDotJson.methods[m].name} not found in workflow functions`);
          }
          if (paramissue) {
            // this is the reason to go through both loops - log which ones are not found so
            // they can be worked
            log.error(`${pronghornDotJson.methods[m].name} has a parameter mismatch`);
          }
          assert.equal(true, found);
          assert.equal(false, paramissue);
        }
        done();
      }).timeout(attemptTimeout);
      it('pronghorn.json should expose all workflow functions', (done) => {
        const pronghornDotJson = require('../../pronghorn.json');
        for (let w = 0; w < wffunctions.length; w += 1) {
          let found = false;

          for (let m = 0; m < pronghornDotJson.methods.length; m += 1) {
            if (pronghornDotJson.methods[m].name === wffunctions[w]) {
              found = true;
              break;
            }
          }

          if (!found) {
            // this is the reason to go through both loops - log which ones are not found so
            // they can be worked
            log.error(`${wffunctions[w]} not found in pronghorn.json`);
          }
          assert.equal(true, found);
        }
        done();
      });
    });

    describe('propertiesSchema.json', () => {
      it('should have a propertiesSchema.json', (done) => {
        fs.exists('propertiesSchema.json', (val) => {
          assert.equal(true, val);
          done();
        });
      });
      it('propertiesSchema.json should be customized', (done) => {
        const propertiesDotJson = require('../../propertiesSchema.json');
        assert.equal('adapter-salesforce', propertiesDotJson.$id);
        done();
      });
    });

    describe('error.json', () => {
      it('should have an error.json', (done) => {
        fs.exists('error.json', (val) => {
          assert.equal(true, val);
          done();
        });
      });
    });

    describe('README.md', () => {
      it('should have a README', (done) => {
        fs.exists('README.md', (val) => {
          assert.equal(true, val);
          done();
        });
      });
      it('README.md should be customized', (done) => {
        fs.readFile('README.md', 'utf8', (err, data) => {
          assert.equal(-1, data.indexOf('[System]'));
          assert.equal(-1, data.indexOf('[system]'));
          assert.equal(-1, data.indexOf('[version]'));
          assert.equal(-1, data.indexOf('[namespace]'));
          done();
        });
      });
    });

    describe('#connect', () => {
      it('should have a connect function', (done) => {
        assert.equal(true, typeof a.connect === 'function');
        done();
      });
    });

    describe('#healthCheck', () => {
      it('should have a healthCheck function', (done) => {
        assert.equal(true, typeof a.healthCheck === 'function');
        done();
      });
    });

    describe('#checkActionFiles', () => {
      it('should have a checkActionFiles function', (done) => {
        assert.equal(true, typeof a.checkActionFiles === 'function');
        done();
      });
      it('should be good', (done) => {
        const clean = a.checkActionFiles();
        assert.equal(true, clean);
        done();
      }).timeout(attemptTimeout);
    });

    describe('#encryptProperty', () => {
      it('should have a encryptProperty function', (done) => {
        assert.equal(true, typeof a.encryptProperty === 'function');
        done();
      });
      it('should get base64 encoded property', (done) => {
        const p = new Promise((resolve) => {
          a.encryptProperty('testing', 'base64', (data, error) => {
            resolve(data);
            assert.equal(undefined, error);
            assert.notEqual(undefined, data);
            assert.notEqual(null, data);
            assert.notEqual(undefined, data.response);
            assert.notEqual(null, data.response);
            assert.equal(0, data.response.indexOf('{code}'));
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should get encrypted property', (done) => {
        const p = new Promise((resolve) => {
          a.encryptProperty('testing', 'encrypt', (data, error) => {
            resolve(data);
            assert.equal(undefined, error);
            assert.notEqual(undefined, data);
            assert.notEqual(null, data);
            assert.notEqual(undefined, data.response);
            assert.notEqual(null, data.response);
            assert.equal(0, data.response.indexOf('{crypt}'));
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    // describe('#hasEntity', () => {
    //   it('should have a hasEntity function', (done) => {
    //     assert.equal(true, typeof a.hasEntity === 'function');
    //     done();
    //   });
    //   it('should find entity', (done) => {
    //     const p = new Promise((resolve) => {
    //       a.hasEntity('template_entity', // 'a9e9c33dc61122760072455df62663d2', (data) => {
    //         resolve(data);
    //         assert.equal(true, data[0]);
    //         done();
    //       });
    //     });
    //     // log just done to get rid of const lint issue!
    //     log.debug(p);
    //   }).timeout(attemptTimeout);
    //   it('should not find entity', (done) => {
    //     const p = new Promise((resolve) => {
    //       a.hasEntity('template_entity', 'blah', (data) => {
    //         resolve(data);
    //         assert.equal(false, data[0]);
    //         done();
    //       });
    //     });
    //     // log just done to get rid of const lint issue!
    //     log.debug(p);
    //   }).timeout(attemptTimeout);
    // });

    describe('#getLocalizations - errors', () => {
      it('should have a getLocalizations function', (done) => {
        assert.equal(true, typeof a.getLocalizations === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getIncidents - errors', () => {
      it('should have a getIncidents function', (done) => {
        assert.equal(true, typeof a.getIncidents === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentsid - errors', () => {
      it('should have a getIncidentsid function', (done) => {
        assert.equal(true, typeof a.getIncidentsid === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing id', (done) => {
        const p = new Promise((resolve) => {
          a.getIncidentsid(null, null, (data, error) => {
            resolve(data);
            const displayE = 'id is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getIncidentsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentsfields - errors', () => {
      it('should have a getIncidentsfields function', (done) => {
        assert.equal(true, typeof a.getIncidentsfields === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentsimpactTypes - errors', () => {
      it('should have a getIncidentsimpactTypes function', (done) => {
        assert.equal(true, typeof a.getIncidentsimpactTypes === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentseventTypes - errors', () => {
      it('should have a getIncidentseventTypes function', (done) => {
        assert.equal(true, typeof a.getIncidentseventTypes === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenances - errors', () => {
      it('should have a getMaintenances function', (done) => {
        assert.equal(true, typeof a.getMaintenances === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenancesid - errors', () => {
      it('should have a getMaintenancesid function', (done) => {
        assert.equal(true, typeof a.getMaintenancesid === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing id', (done) => {
        const p = new Promise((resolve) => {
          a.getMaintenancesid(null, null, (data, error) => {
            resolve(data);
            const displayE = 'id is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getMaintenancesid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenancesfields - errors', () => {
      it('should have a getMaintenancesfields function', (done) => {
        assert.equal(true, typeof a.getMaintenancesfields === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenanceseventTypes - errors', () => {
      it('should have a getMaintenanceseventTypes function', (done) => {
        assert.equal(true, typeof a.getMaintenanceseventTypes === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getGeneralMessages - errors', () => {
      it('should have a getGeneralMessages function', (done) => {
        assert.equal(true, typeof a.getGeneralMessages === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getGeneralMessagesid - errors', () => {
      it('should have a getGeneralMessagesid function', (done) => {
        assert.equal(true, typeof a.getGeneralMessagesid === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing id', (done) => {
        const p = new Promise((resolve) => {
          a.getGeneralMessagesid(null, (data, error) => {
            resolve(data);
            const displayE = 'id is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getGeneralMessagesid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMetricValues - errors', () => {
      it('should have a getMetricValues function', (done) => {
        assert.equal(true, typeof a.getMetricValues === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getMetricValuesid - errors', () => {
      it('should have a getMetricValuesid function', (done) => {
        assert.equal(true, typeof a.getMetricValuesid === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing id', (done) => {
        const p = new Promise((resolve) => {
          a.getMetricValuesid(null, (data, error) => {
            resolve(data);
            const displayE = 'id is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getMetricValuesid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getLocales - errors', () => {
      it('should have a getLocales function', (done) => {
        assert.equal(true, typeof a.getLocales === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getServices - errors', () => {
      it('should have a getServices function', (done) => {
        assert.equal(true, typeof a.getServices === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getInstances - errors', () => {
      it('should have a getInstances function', (done) => {
        assert.equal(true, typeof a.getInstances === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getInstancesstatus - errors', () => {
      it('should have a getInstancesstatus function', (done) => {
        assert.equal(true, typeof a.getInstancesstatus === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getInstancesstatuspreview - errors', () => {
      it('should have a getInstancesstatuspreview function', (done) => {
        assert.equal(true, typeof a.getInstancesstatuspreview === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceskeystatuspreview - errors', () => {
      it('should have a getInstanceskeystatuspreview function', (done) => {
        assert.equal(true, typeof a.getInstanceskeystatuspreview === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing key', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceskeystatuspreview(null, null, null, null, (data, error) => {
            resolve(data);
            const displayE = 'key is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getInstanceskeystatuspreview', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceskeystatus - errors', () => {
      it('should have a getInstanceskeystatus function', (done) => {
        assert.equal(true, typeof a.getInstanceskeystatus === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing key', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceskeystatus(null, null, null, null, (data, error) => {
            resolve(data);
            const displayE = 'key is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getInstanceskeystatus', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceAliaseskeystatus - errors', () => {
      it('should have a getInstanceAliaseskeystatus function', (done) => {
        assert.equal(true, typeof a.getInstanceAliaseskeystatus === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing key', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceAliaseskeystatus(null, (data, error) => {
            resolve(data);
            const displayE = 'key is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getInstanceAliaseskeystatus', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceAliaseskey - errors', () => {
      it('should have a getInstanceAliaseskey function', (done) => {
        assert.equal(true, typeof a.getInstanceAliaseskey === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing key', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceAliaseskey(null, (data, error) => {
            resolve(data);
            const displayE = 'key is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getInstanceAliaseskey', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getProducts - errors', () => {
      it('should have a getProducts function', (done) => {
        assert.equal(true, typeof a.getProducts === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getProductskey - errors', () => {
      it('should have a getProductskey function', (done) => {
        assert.equal(true, typeof a.getProductskey === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing key', (done) => {
        const p = new Promise((resolve) => {
          a.getProductskey(null, (data, error) => {
            resolve(data);
            const displayE = 'key is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getProductskey', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#postSubscribe - errors', () => {
      it('should have a postSubscribe function', (done) => {
        assert.equal(true, typeof a.postSubscribe === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing body', (done) => {
        const p = new Promise((resolve) => {
          a.postSubscribe('fakeparam', null, (data, error) => {
            resolve(data);
            const displayE = 'body is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-postSubscribe', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#patchUnsubscribe - errors', () => {
      it('should have a patchUnsubscribe function', (done) => {
        assert.equal(true, typeof a.patchUnsubscribe === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#postUnsubscribe - errors', () => {
      it('should have a postUnsubscribe function', (done) => {
        assert.equal(true, typeof a.postUnsubscribe === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#postLogin - errors', () => {
      it('should have a postLogin function', (done) => {
        assert.equal(true, typeof a.postLogin === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing body', (done) => {
        const p = new Promise((resolve) => {
          a.postLogin('fakeparam', null, (data, error) => {
            resolve(data);
            const displayE = 'body is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-postLogin', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getLogout - errors', () => {
      it('should have a getLogout function', (done) => {
        assert.equal(true, typeof a.getLogout === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing token', (done) => {
        const p = new Promise((resolve) => {
          a.getLogout(null, (data, error) => {
            resolve(data);
            const displayE = 'token is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getLogout', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getSubscribers - errors', () => {
      it('should have a getSubscribers function', (done) => {
        assert.equal(true, typeof a.getSubscribers === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing token', (done) => {
        const p = new Promise((resolve) => {
          a.getSubscribers(null, null, (data, error) => {
            resolve(data);
            const displayE = 'token is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getSubscribers', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#patchSubscribers - errors', () => {
      it('should have a patchSubscribers function', (done) => {
        assert.equal(true, typeof a.patchSubscribers === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing token', (done) => {
        const p = new Promise((resolve) => {
          a.patchSubscribers('fakeparam', null, null, (data, error) => {
            resolve(data);
            const displayE = 'token is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-patchSubscribers', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should error if - missing body', (done) => {
        const p = new Promise((resolve) => {
          a.patchSubscribers('fakeparam', 'fakeparam', null, (data, error) => {
            resolve(data);
            const displayE = 'body is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-patchSubscribers', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#postSubscriberssubscriptionsid - errors', () => {
      it('should have a postSubscriberssubscriptionsid function', (done) => {
        assert.equal(true, typeof a.postSubscriberssubscriptionsid === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing id', (done) => {
        const p = new Promise((resolve) => {
          a.postSubscriberssubscriptionsid(null, null, null, (data, error) => {
            resolve(data);
            const displayE = 'id is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-postSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should error if - missing token', (done) => {
        const p = new Promise((resolve) => {
          a.postSubscriberssubscriptionsid('fakeparam', null, null, (data, error) => {
            resolve(data);
            const displayE = 'token is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-postSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should error if - missing body', (done) => {
        const p = new Promise((resolve) => {
          a.postSubscriberssubscriptionsid('fakeparam', 'fakeparam', null, (data, error) => {
            resolve(data);
            const displayE = 'body is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-postSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#patchSubscriberssubscriptionsid - errors', () => {
      it('should have a patchSubscriberssubscriptionsid function', (done) => {
        assert.equal(true, typeof a.patchSubscriberssubscriptionsid === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing id', (done) => {
        const p = new Promise((resolve) => {
          a.patchSubscriberssubscriptionsid(null, null, null, (data, error) => {
            resolve(data);
            const displayE = 'id is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-patchSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should error if - missing token', (done) => {
        const p = new Promise((resolve) => {
          a.patchSubscriberssubscriptionsid('fakeparam', null, null, (data, error) => {
            resolve(data);
            const displayE = 'token is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-patchSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should error if - missing body', (done) => {
        const p = new Promise((resolve) => {
          a.patchSubscriberssubscriptionsid('fakeparam', 'fakeparam', null, (data, error) => {
            resolve(data);
            const displayE = 'body is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-patchSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#deleteSubscriberssubscriptionsid - errors', () => {
      it('should have a deleteSubscriberssubscriptionsid function', (done) => {
        assert.equal(true, typeof a.deleteSubscriberssubscriptionsid === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing id', (done) => {
        const p = new Promise((resolve) => {
          a.deleteSubscriberssubscriptionsid(null, null, null, (data, error) => {
            resolve(data);
            const displayE = 'id is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-deleteSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should error if - missing token', (done) => {
        const p = new Promise((resolve) => {
          a.deleteSubscriberssubscriptionsid('fakeparam', null, null, (data, error) => {
            resolve(data);
            const displayE = 'token is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-deleteSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
      it('should error if - missing body', (done) => {
        const p = new Promise((resolve) => {
          a.deleteSubscriberssubscriptionsid('fakeparam', 'fakeparam', null, (data, error) => {
            resolve(data);
            const displayE = 'body is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-deleteSubscriberssubscriptionsid', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getSearchkey - errors', () => {
      it('should have a getSearchkey function', (done) => {
        assert.equal(true, typeof a.getSearchkey === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing key', (done) => {
        const p = new Promise((resolve) => {
          a.getSearchkey(null, (data, error) => {
            resolve(data);
            const displayE = 'key is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getSearchkey', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getTags - errors', () => {
      it('should have a getTags function', (done) => {
        assert.equal(true, typeof a.getTags === 'function');
        done();
      }).timeout(attemptTimeout);
    });

    describe('#getTagsinstanceinstanceKey - errors', () => {
      it('should have a getTagsinstanceinstanceKey function', (done) => {
        assert.equal(true, typeof a.getTagsinstanceinstanceKey === 'function');
        done();
      }).timeout(attemptTimeout);
      it('should error if - missing instanceKey', (done) => {
        const p = new Promise((resolve) => {
          a.getTagsinstanceinstanceKey(null, null, (data, error) => {
            resolve(data);
            const displayE = 'instanceKey is required';
            runErrorAsserts(data, error, 'AD.300', 'Test-salesforce-adapter-getTagsinstanceinstanceKey', displayE);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getTagTypes - errors', () => {
      it('should have a getTagTypes function', (done) => {
        assert.equal(true, typeof a.getTagTypes === 'function');
        done();
      }).timeout(attemptTimeout);
    });
  });
});
