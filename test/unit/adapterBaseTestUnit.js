// Set globals
/* global describe it log pronghornProps */
/* eslint global-require: warn */
/* eslint no-unused-vars: warn */

// include required items for testing & logging
const assert = require('assert');
const fs = require('fs-extra');
const mocha = require('mocha');
const path = require('path');
const winston = require('winston');
const { expect } = require('chai');
const { use } = require('chai');
const td = require('testdouble');

const anything = td.matchers.anything();

// stub and attemptTimeout are used throughout the code so set them here
let logLevel = 'none';
const stub = true;
const isRapidFail = false;
const attemptTimeout = 120000;

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
      id: 'Test-Base',
      type: 'ABase',
      properties: {
        host,
        port,
        base_path: '/',
        version: '',
        cache_location: 'local',
        encode_pathvars: true,
        save_metric: false,
        stub,
        protocol,
        authentication: {
          auth_method: 'basic user_password',
          username,
          password,
          token: '',
          invalid_token_error: 401,
          token_timeout: -1,
          token_cache: 'local',
          auth_field: 'header.headers.Authorization',
          auth_field_format: 'Basic {b64}{username}:{password}{/b64}',
          auth_logging: false,
          client_id: '',
          client_secret: '',
          grant_type: ''
        },
        healthcheck: {
          type: 'none',
          frequency: 60000,
          query_object: {}
        },
        throttle: {
          throttle_enabled: false,
          number_pronghorns: 1,
          sync_async: 'sync',
          max_in_queue: 1000,
          concurrent_max: 1,
          expire_timeout: 0,
          avg_runtime: 200,
          priorities: [
            {
              value: 0,
              percent: 100
            }
          ]
        },
        request: {
          number_redirects: 0,
          number_retries: 3,
          limit_retry_error: [0],
          failover_codes: [],
          attempt_timeout: attemptTimeout,
          global_request: {
            payload: {},
            uriOptions: {},
            addlHeaders: {},
            authData: {}
          },
          healthcheck_on_timeout: true,
          return_raw: true,
          archiving: false,
          return_request: false
        },
        proxy: {
          enabled: false,
          host: '',
          port: 1,
          protocol: 'http',
          username: '',
          password: ''
        },
        ssl: {
          ecdhCurve: '',
          enabled: sslenable,
          accept_invalid_cert: sslinvalid,
          ca_file: '',
          key_file: '',
          cert_file: '',
          secure_protocol: '',
          ciphers: ''
        },
        mongo: {
          host: '',
          port: 0,
          database: '',
          username: '',
          password: '',
          replSet: '',
          db_ssl: {
            enabled: false,
            accept_invalid_cert: false,
            ca_file: '',
            key_file: '',
            cert_file: ''
          }
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
global.log = winston.createLogger({
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
const AdapterBase = require('../../adapterBase');

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

describe('[unit] Adapter Base Test', () => {
  describe('Adapter Base Class Tests', () => {
    // Define constants we will use below
    const a = new AdapterBase(
      pronghornProps.adapterProps.adapters[0].id,
      pronghornProps.adapterProps.adapters[0].properties
    );

    if (isRapidFail) {
      const state = {};
      state.passed = true;

      mocha.afterEach(function x() {
        state.passed = state.passed
        && (this.currentTest.state === 'passed');
      });
      mocha.beforeEach(function x() {
        if (!state.passed) {
          return this.currentTest.skip();
        }
        return true;
      });
    }

    describe('#class instance created', () => {
      it('should be a class with properties', (done) => {
        try {
          assert.notEqual(null, a);
          assert.notEqual(undefined, a);
          assert.notEqual(null, a.allProps);
          const check = global.pronghornProps.adapterProps.adapters[0].properties.healthcheck.type;
          assert.equal(check, a.healthcheckType);
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('adapterBase.js', () => {
      it('should have an adapterBase.js', (done) => {
        try {
          fs.exists('adapterBase.js', (val) => {
            assert.equal(true, val);
            done();
          });
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
    });

    describe('#refreshProperties', () => {
      it('should have a refreshProperties function', (done) => {
        try {
          assert.equal(true, typeof a.refreshProperties === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should update the properties file', (done) => {
        try {
          // Mock connections
          a.requestHandlerInst.refreshProperties = td.func();
          a.refreshProperties({ foo: 'bar' });
          // Run assert to verify we have updated a
          try {
            assert.equal(true, a.allProps.foo === 'bar');
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should fail if the validation does not match the schema', (done) => {
        try {
          // Mock connections
          a.propUtilInst.mergeProperties = td.func();
          a.refreshProperties('tacos');
          done();
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#getAllFunctions', () => {
      it('should have a getAllFunctions function', (done) => {
        try {
          assert.equal(true, typeof a.getAllFunctions === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should return a list of functions', (done) => {
        const returnedFunctions = ['addEntityCache', 'capabilityResults', 'checkActionFiles', 'checkProperties', 'connect', 'encryptProperty',
          'entityInList', 'getAllCapabilities', 'getAllFunctions', 'getConfig', 'getDevice', 'getDevicesFiltered', 'hasDevices', 'hasEntities',
          'healthCheck', 'iapFindAdapterPath', 'iapGetAdapterQueue', 'iapGetAdapterWorkflowFunctions', 'iapGetDeviceCount', 'iapMakeBrokerCall',
          'iapMoveAdapterEntitiesToDB', 'iapRunAdapterBasicGet', 'iapRunAdapterConnectivity', 'iapRunAdapterHealthcheck', 'iapSuspendAdapter',
          'iapTroubleshootAdapter', 'iapUnsuspendAdapter', 'iapUpdateAdapterConfiguration', 'isAlive', 'refreshProperties', 'addListener',
          'emit', 'eventNames', 'getMaxListeners', 'listenerCount', 'listeners', 'off', 'on', 'once', 'prependListener',
          'prependOnceListener', 'rawListeners', 'removeAllListeners', 'removeListener', 'setMaxListeners'];
        try {
          const expectedFunctions = a.getAllFunctions();
          try {
            assert.equal(JSON.stringify(expectedFunctions), JSON.stringify(returnedFunctions));
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#iapGetAdapterWorkflowFunctions', () => {
      it('should have a iapGetAdapterWorkflowFunctions function', (done) => {
        try {
          assert.equal(true, typeof a.iapGetAdapterWorkflowFunctions === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should retrieve workflow functions', (done) => {
        try {
          const expectedFunctions = a.iapGetAdapterWorkflowFunctions([]);
          try {
            assert.equal(0, expectedFunctions.length);
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#checkProperties', () => {
      it('should have a checkProperties function', (done) => {
        try {
          assert.equal(true, typeof a.checkProperties === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('the sample properties should be good - if failure change the log level', (done) => {
        try {
          const samplePropsJson = require('../../sampleProperties.json');
          const clean = a.checkProperties(samplePropsJson.properties);
          try {
            assert.notEqual(0, Object.keys(clean));
            assert.equal(undefined, clean.exception);
            assert.notEqual(undefined, clean.host);
            assert.notEqual(null, clean.host);
            assert.notEqual('', clean.host);
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#checkActionFiles', () => {
      it('should have a checkActionFiles function', (done) => {
        try {
          assert.equal(true, typeof a.checkActionFiles === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('the action files should be good - if failure change the log level as most issues are warnings', (done) => {
        try {
          const clean = a.checkActionFiles();
          try {
            for (let c = 0; c < clean.length; c += 1) {
              log.error(clean[c]);
            }
            assert.equal(0, clean.length);
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#iapGetAdapterQueue', () => {
      it('should have a iapGetAdapterQueue function', (done) => {
        try {
          assert.equal(true, typeof a.iapGetAdapterQueue === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should get information for all of the requests currently in the queue', (done) => {
        try {
          const expectedFunctions = a.iapGetAdapterQueue();
          try {
            assert.equal(0, expectedFunctions.length);
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#connect', () => {
      it('should have a connect function', (done) => {
        try {
          assert.equal(true, typeof a.connect === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should get connected - no healthcheck', (done) => {
        try {
          a.healthcheckType = 'none';
          a.connect();

          try {
            assert.equal(true, a.alive);
            done();
          } catch (error) {
            log.error(`Test Failure: ${error}`);
            done(error);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      });
      it('should get connected - startup healthcheck', (done) => {
        try {
          a.healthcheckType = 'startup';
          a.connect();

          try {
            assert.equal(true, a.alive);
            done();
          } catch (error) {
            log.error(`Test Failure: ${error}`);
            done(error);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      });
    });

    describe('#healthCheck', () => {
      it('should have a healthCheck function', (done) => {
        try {
          assert.equal(true, typeof a.healthCheck === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should be healthy', (done) => {
        try {
          a.healthCheck(null, (data) => {
            try {
              assert.equal(true, a.healthy);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#encryptProperty', () => {
      it('should have a encryptProperty function', (done) => {
        try {
          assert.equal(true, typeof a.encryptProperty === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should get base64 encoded property', (done) => {
        try {
          a.encryptProperty('testing', 'base64', (data, error) => {
            try {
              assert.equal(undefined, error);
              assert.notEqual(undefined, data);
              assert.notEqual(null, data);
              assert.notEqual(undefined, data.response);
              assert.notEqual(null, data.response);
              assert.equal(0, data.response.indexOf('{code}'));
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should get encrypted property', (done) => {
        try {
          a.encryptProperty('testing', 'encrypt', (data, error) => {
            try {
              assert.equal(undefined, error);
              assert.notEqual(undefined, data);
              assert.notEqual(null, data);
              assert.notEqual(undefined, data.response);
              assert.notEqual(null, data.response);
              assert.equal(0, data.response.indexOf('{crypt}'));
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    const entityType = 'mockType';
    const entities = {
      response: [
        {
          name: 'Godric Gryffindor'
        }, {
          name: 'Salazar Slytherin'
        }
      ]
    };
    const key = 'name';
    describe('#addEntityCache', () => {
      it('should have a addEntityCache function', (done) => {
        try {
          assert.equal(true, typeof a.addEntityCache === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should take the entities and add them to the cache', (done) => {
        // Run the promise and verify the results match what we were expecting.
        try {
          a.addEntityCache(entityType, entities, key, (data, error) => {
            try {
              assert.equal(true, data);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    const cache = [
      'Godric Gryffindor',
      'Salazar Slytherin'
    ];
    describe('#entityInList', () => {
      it('should have a entityInList function', (done) => {
        try {
          assert.equal(true, typeof a.entityInList === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should return true if the entity is in the list of entities for this adapter', (done) => {
        try {
          const entityExist = a.entityInList('Godric Gryffindor', cache);
          try {
            assert.equal(true, entityExist[0]);
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should return false if the entity is not in the list of entities for this adapter', (done) => {
        try {
          const entityExist = a.entityInList('XXXX', cache);
          try {
            assert.equal(false, entityExist[0]);
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should return status of each item if an array is passed', (done) => {
        try {
          const entityExist = a.entityInList(['Godric Gryffindor', 'XXXX'], cache);
          try {
            assert.equal(true, entityExist[0]);
            assert.equal(false, entityExist[1]);
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#capabilityResults', () => {
      it('should have a capabilityResults function', (done) => {
        try {
          assert.equal(true, typeof a.capabilityResults === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should throw an error if needupdate is passed into the function', (done) => {
        try {
          const results = ['needupdate'];
          a.capabilityResults(results, (data, error) => {
            try {
              const displayE = 'Could not load entity: unknown, into cache';
              runErrorAsserts(data, error, 'AD.320', 'Test-Base-adapterBase-capabilityResults', displayE);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should throw an error if error is passed into the function', (done) => {
        try {
          const results = ['error'];
          a.capabilityResults(results, (data, error) => {
            try {
              const displayE = 'Could not verify entity in cache';
              runErrorAsserts(data, error, 'AD.321', 'Test-Base-adapterBase-capabilityResults', displayE);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should return null if nothing passed in', (done) => {
        try {
          const results = null;
          a.capabilityResults(results, (data, error) => {
            try {
              assert.equal(null, data);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should return true if results is not an array and is "found"', (done) => {
        try {
          const results = 'found';
          a.capabilityResults(results, (data, error) => {
            try {
              assert.equal(true, data[0]);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should return false if results is not an array and is not "found"', (done) => {
        try {
          const results = 'notfound';
          a.capabilityResults(results, (data, error) => {
            try {
              assert.equal(false, data[0]);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should process an incoming array and return an array of values', (done) => {
        try {
          const results = ['found', 'notFound', 'found'];
          a.capabilityResults(results, (data, error) => {
            try {
              assert.equal(true, data[0]);
              assert.equal(false, data[1]);
              assert.equal(true, data[2]);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#getAllCapabilities', () => {
      it('should have a getAllCapabilities function', (done) => {
        try {
          assert.equal(true, typeof a.getAllCapabilities === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should have capabilities returned', (done) => {
        try {
          const expectedCapabilities = a.getAllCapabilities();
          try {
            assert.notEqual(0, expectedCapabilities.length);
            assert.equal('.generic', expectedCapabilities[0].entity);
            assert.equal(10, expectedCapabilities[0].actions.length);
            assert.equal('getGenerics', expectedCapabilities[0].actions[0]);
            assert.equal('createGeneric', expectedCapabilities[0].actions[1]);
            assert.equal('updateGeneric', expectedCapabilities[0].actions[2]);
            assert.equal('patchGeneric', expectedCapabilities[0].actions[3]);
            assert.equal('deleteGeneric', expectedCapabilities[0].actions[4]);
            assert.equal('getGenericsNoBase', expectedCapabilities[0].actions[5]);
            assert.equal('createGenericNoBase', expectedCapabilities[0].actions[6]);
            assert.equal('updateGenericNoBase', expectedCapabilities[0].actions[7]);
            assert.equal('patchGenericNoBase', expectedCapabilities[0].actions[8]);
            assert.equal('deleteGenericNoBase', expectedCapabilities[0].actions[9]);
            assert.equal('.system', expectedCapabilities[1].entity);
            assert.equal(2, expectedCapabilities[1].actions.length);
            assert.equal('getToken', expectedCapabilities[1].actions[0]);
            assert.equal('healthcheck', expectedCapabilities[1].actions[1]);
            for (let e = 1; e < expectedCapabilities.length; e += 1) {
              assert.notEqual('', expectedCapabilities[e].entity);
              assert.notEqual(null, expectedCapabilities[e].actions);
            }
            done();
          } catch (err) {
            log.error(`Test Failure: ${err}`);
            done(err);
          }
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });

    describe('#iapUpdateAdapterConfiguration', () => {
      it('should have a iapUpdateAdapterConfiguration function', (done) => {
        try {
          assert.equal(true, typeof a.iapUpdateAdapterConfiguration === 'function');
          done();
        } catch (error) {
          log.error(`Test Failure: ${error}`);
          done(error);
        }
      });
      it('should return no updated if no changes are provided', (done) => {
        try {
          a.iapUpdateAdapterConfiguration(null, null, null, null, null, (data, error) => {
            try {
              assert.equal('No configuration updates to make', data.response);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('should throw an error if missing configuration file', (done) => {
        try {
          a.iapUpdateAdapterConfiguration(null, { name: 'fakeChange' }, null, null, null, (data, error) => {
            try {
              const displayE = 'configFile is required';
              runErrorAsserts(data, error, 'AD.300', 'Test-Base-adapterBase-iapUpdateAdapterConfiguration', displayE);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('if not package.json, entity is required', (done) => {
        try {
          a.iapUpdateAdapterConfiguration('notPackage', { name: 'fakeChange' }, null, null, null, (data, error) => {
            try {
              const displayE = 'Unsupported Configuration Change or Missing Entity';
              runErrorAsserts(data, error, 'AD.999', 'Test-Base-adapterBase-iapUpdateAdapterConfiguration', displayE);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('if not package.json, type is required', (done) => {
        try {
          a.iapUpdateAdapterConfiguration('notPackage', { name: 'fakeChange' }, 'entity', null, null, (data, error) => {
            try {
              const displayE = 'type is required';
              runErrorAsserts(data, error, 'AD.300', 'Test-Base-adapterBase-iapUpdateAdapterConfiguration', displayE);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
      it('if not package.json, entity must be valid', (done) => {
        try {
          a.iapUpdateAdapterConfiguration('notPackage', { name: 'fakeChange' }, 'fakeEntity', 'fakeType', null, (data, error) => {
            try {
              const displayE = 'Incomplete Configuration Change: Invalid Entity - fakeEntity';
              runErrorAsserts(data, error, 'AD.999', 'Test-Base-adapterBase-iapUpdateAdapterConfiguration', displayE);
              done();
            } catch (err) {
              log.error(`Test Failure: ${err}`);
              done(err);
            }
          });
        } catch (error) {
          log.error(`Adapter Exception: ${error}`);
          done(error);
        }
      }).timeout(attemptTimeout);
    });
  });
});
