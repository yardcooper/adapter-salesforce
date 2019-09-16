/* @copyright Itential, LLC 2019 (pre-modifications) */

// Set globals
/* global describe it log pronghornProps */
/* eslint no-unused-vars: warn */

// include required items for testing & logging
const assert = require('assert');
const fs = require('fs');
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
const isSaveMockData = false;
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
          auth_method: 'no_authentication',
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
 * Runs the common asserts for test
 */
function runCommonAsserts(data, error) {
  assert.equal(undefined, error);
  assert.notEqual(undefined, data);
  assert.notEqual(null, data);
  assert.notEqual(undefined, data.response);
  assert.notEqual(null, data.response);
}

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

/**
 * @function saveMockData
 * Attempts to take data from responses and place them in MockDataFiles to help create Mockdata.
 * Note, this was built based on entity file structure for Adapter-Engine 1.6.x
 * @param {string} entityName - Name of the entity saving mock data for
 * @param {string} actionName -  Name of the action saving mock data for
 * @param {string} descriptor -  Something to describe this test (used as a type)
 * @param {string or object} responseData - The data to put in the mock file.
 */
function saveMockData(entityName, actionName, descriptor, responseData) {
  // do not need to save mockdata if we are running in stub mode (already has mock data) or if told not to save
  if (stub || !isSaveMockData) {
    return false;
  }

  // must have a response in order to store the response
  if (responseData && responseData.response) {
    const data = responseData.response;

    try {
      const base = `./entities/${entityName}/`;
      const filename = `mockdatafiles/${actionName}-${descriptor}.json`;

      // write the data we retrieved
      fs.writeFile(base + filename, JSON.stringify(data, null, 2), 'utf8', (errWritingMock) => {
        if (errWritingMock) throw errWritingMock;

        // update the action file to reflect the changes. Note: We're replacing the default object for now!
        fs.readFile(`${base}action.json`, (errRead, content) => {
          if (errRead) throw errRead;

          // parse the action file into JSON
          const parsedJson = JSON.parse(content);

          // The object update we'll write in.
          const responseObj = {
            type: descriptor,
            key: '',
            mockFile: filename
          };

          // get the object for method we're trying to change.
          const currentMethodAction = parsedJson.actions.find(obj => obj.name === actionName);

          // if the method was not found - should never happen but...
          if (!currentMethodAction) {
            throw Error('Can\'t find an action for this method in the provided entity.');
          }

          // if there is a response object, we want to replace the Response object. Otherwise we'll create one.
          const actionResponseObj = currentMethodAction.responseObjects.find(obj => obj.type === descriptor);

          // Add the action responseObj back into the array of response objects.
          if (!actionResponseObj) {
            // if there is a default response object, we want to get the key.
            const defaultResponseObj = currentMethodAction.responseObjects.find(obj => obj.type === 'default');

            // save the default key into the new response object
            if (!defaultResponseObj) {
              responseObj.key = defaultResponseObj.key;
            }

            // save the new response object
            currentMethodAction.responseObjects = [responseObj];
          } else {
            // update the location of the mock data file
            actionResponseObj.mockFile = responseObj.mockFile;
          }

          // Save results
          fs.writeFile(`${base}action.json`, JSON.stringify(parsedJson, null, 2), (err) => {
            if (err) throw err;
          });
        });
      });
    } catch (e) {
      log.debug(`Failed to save mock data for ${actionName}. ${e.message}`);
      return false;
    }
  }

  // no response to save
  log.debug(`No data passed to save into mockdata for ${actionName}`);
  return false;
}


// require the adapter that we are going to be using
const Salesforce = require('../../adapter.js');

// begin the testing - these should be pretty well defined between the describe and the it!
describe('[integration] Salesforce Adapter Test', () => {
  describe('Salesforce Class Tests', () => {
    const a = new Salesforce(
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

    describe('#connect', () => {
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
      it('should be healthy', (done) => {
        try {
          a.healthCheck(null, (data) => {
            try {
              assert.equal(true, a.healthy);
              saveMockData('system', 'healthcheck', 'default', data);
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

    /*
    -----------------------------------------------------------------------
    -----------------------------------------------------------------------
    *** All code above this comment will be replaced during a migration ***
    ******************* DO NOT REMOVE THIS COMMENT BLOCK ******************
    -----------------------------------------------------------------------
    -----------------------------------------------------------------------
    */

    describe('#getLocalizations - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getLocalizations('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getIncidents - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getIncidents('fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getIncidentsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getIncidentsid('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal(3, data.response.id);
                assert.equal('object', typeof data.response.message);
                assert.equal('object', typeof data.response.externalId);
                assert.equal(true, data.response.affectsAll);
                assert.equal(false, data.response.isCore);
                assert.equal('object', typeof data.response.additionalInformation);
                assert.equal(true, Array.isArray(data.response.serviceKeys));
                assert.equal(true, Array.isArray(data.response.instanceKeys));
                assert.equal(true, Array.isArray(data.response.IncidentImpacts));
                assert.equal(true, Array.isArray(data.response.IncidentEvents));
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getIncidentsfields - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getIncidentsfields('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
                assert.equal('object', typeof data.response[2]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getIncidentsimpactTypes - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getIncidentsimpactTypes('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getIncidentseventTypes - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getIncidentseventTypes('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getMaintenances - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getMaintenances('fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getMaintenancesid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getMaintenancesid('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal(8, data.response.id);
                assert.equal('object', typeof data.response.message);
                assert.equal('object', typeof data.response.externalId);
                assert.equal('object', typeof data.response.name);
                assert.equal(false, data.response.affectsAll);
                assert.equal(true, data.response.isCore);
                assert.equal('object', typeof data.response.plannedStartTime);
                assert.equal('object', typeof data.response.plannedEndTime);
                assert.equal('object', typeof data.response.additionalInformation);
                assert.equal(true, Array.isArray(data.response.serviceKeys));
                assert.equal(true, Array.isArray(data.response.instanceKeys));
                assert.equal(true, Array.isArray(data.response.MaintenanceImpacts));
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getMaintenancesfields - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getMaintenancesfields('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getMaintenanceseventTypes - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getMaintenanceseventTypes('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getGeneralMessages - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getGeneralMessages('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getGeneralMessagesid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getGeneralMessagesid('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal(1, data.response.id);
                assert.equal('string', data.response.subject);
                assert.equal('string', data.response.body);
                assert.equal('string', data.response.startDate);
                assert.equal('object', typeof data.response.endDate);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getMetricValues - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getMetricValues('fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getMetricValuesid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getMetricValuesid('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.metricValueName);
                assert.equal(1, data.response.value);
                assert.equal('string', data.response.timestamp);
                assert.equal('string', data.response.instanceKey);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getLocales - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getLocales('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getServices - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getServices('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getInstances - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        try {
          a.getInstances('fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              if (stub) {
                assert.notEqual(undefined, error);
                assert.notEqual(null, error);
                assert.equal(null, data);
                assert.equal('AD.500', error.icode);
                assert.equal('Error 400 received on request', error.IAPerror.displayString);
                const temp = 'no mock data for';
                assert.equal(0, error.IAPerror.raw_response.message.indexOf(temp));
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getInstancesstatus - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getInstancesstatus('fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
                assert.equal('object', typeof data.response[2]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getInstancesstatuspreview - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getInstancesstatuspreview('fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
                assert.equal('object', typeof data.response[2]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getInstanceskeystatuspreview - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getInstanceskeystatuspreview('fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
                assert.equal('object', typeof data.response[2]);
                assert.equal('object', typeof data.response[3]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getInstanceskeystatus - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getInstanceskeystatus('fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
                assert.equal('object', typeof data.response[2]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getInstanceAliaseskeystatus - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getInstanceAliaseskeystatus('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
                assert.equal('object', typeof data.response[2]);
                assert.equal('object', typeof data.response[3]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getInstanceAliaseskey - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getInstanceAliaseskey('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.key);
                assert.equal('string', data.response.instanceKey);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getProducts - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getProducts((data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
                assert.equal('object', typeof data.response[1]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getProductskey - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getProductskey('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.key);
                assert.equal(8, data.response.parentId);
                assert.equal('string', data.response.parentName);
                assert.equal(1, data.response.order);
                assert.equal('string', data.response.path);
                assert.equal(true, data.response.public);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#postSubscribe - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.postSubscribe('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(true, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#patchUnsubscribe - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.patchUnsubscribe('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(true, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#postUnsubscribe - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.postUnsubscribe('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(true, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#postLogin - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.postLogin('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getLogout - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        try {
          a.getLogout('fakedata', (data, error) => {
            try {
              if (stub) {
                assert.notEqual(undefined, error);
                assert.notEqual(null, error);
                assert.equal(null, data);
                assert.equal('AD.500', error.icode);
                assert.equal('Error 400 received on request', error.IAPerror.displayString);
                const temp = 'no mock data for';
                assert.equal(0, error.IAPerror.raw_response.message.indexOf(temp));
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getSubscribers - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getSubscribers('fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(true, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#patchSubscribers - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.patchSubscribers('fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(false, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#postSubscriberssubscriptionsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.postSubscriberssubscriptionsid('fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(true, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#patchSubscriberssubscriptionsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.patchSubscriberssubscriptionsid('fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(false, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#deleteSubscriberssubscriptionsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.deleteSubscriberssubscriptionsid('fakedata', 'fakedata', 'fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('string', data.response.emailAddress);
                assert.equal('string', data.response.locale);
                assert.equal(true, Array.isArray(data.response.subscription));
                assert.equal(false, data.response.isActive);
                assert.equal('string', data.response.createdAt);
                assert.equal('string', data.response.updatedAt);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getSearchkey - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        try {
          a.getSearchkey('fakedata', (data, error) => {
            try {
              runCommonAsserts(data, error);

              if (stub) {
                assert.equal('object', typeof data.response[0]);
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getTags - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        try {
          a.getTags((data, error) => {
            try {
              if (stub) {
                assert.notEqual(undefined, error);
                assert.notEqual(null, error);
                assert.equal(null, data);
                assert.equal('AD.500', error.icode);
                assert.equal('Error 400 received on request', error.IAPerror.displayString);
                const temp = 'no mock data for';
                assert.equal(0, error.IAPerror.raw_response.message.indexOf(temp));
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getTagsinstanceinstanceKey - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        try {
          a.getTagsinstanceinstanceKey('fakedata', 'fakedata', (data, error) => {
            try {
              if (stub) {
                assert.notEqual(undefined, error);
                assert.notEqual(null, error);
                assert.equal(null, data);
                assert.equal('AD.500', error.icode);
                assert.equal('Error 400 received on request', error.IAPerror.displayString);
                const temp = 'no mock data for';
                assert.equal(0, error.IAPerror.raw_response.message.indexOf(temp));
              } else {
                runCommonAsserts(data, error);
              }

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

    describe('#getTagTypes - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        try {
          a.getTagTypes((data, error) => {
            try {
              if (stub) {
                assert.notEqual(undefined, error);
                assert.notEqual(null, error);
                assert.equal(null, data);
                assert.equal('AD.500', error.icode);
                assert.equal('Error 400 received on request', error.IAPerror.displayString);
                const temp = 'no mock data for';
                assert.equal(0, error.IAPerror.raw_response.message.indexOf(temp));
              } else {
                runCommonAsserts(data, error);
              }

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
