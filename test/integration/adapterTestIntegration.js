// Set globals
/* global describe it log pronghornProps */

// include required items for testing & logging
const assert = require('assert');
const winston = require('winston');

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


// require the adapter that we are going to be using
const Salesforce = require('../../adapter.js');

// begin the testing - these should be pretty well defined between the describe and the it!
describe('[integration] Salesforce Adapter Test', () => {
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

    describe('#connect', () => {
      it('should get connected - no healthcheck', (done) => {
        a.healthcheckType = 'none';
        a.connect();
        assert.equal(true, a.alive);
        done();
      });
      it('should get connected - startup healthcheck', (done) => {
        a.healthcheckType = 'startup';
        a.connect();
        assert.equal(true, a.alive);
        done();
      });
    });

    describe('#healthCheck', () => {
      it('should be healthy', (done) => {
        const p = new Promise((resolve) => {
          a.healthCheck(null, (data) => {
            resolve(data);
            assert.equal(true, a.healthy);
            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getLocalizations - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getLocalizations('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getIncidents - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getIncidents('fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getIncidentsid('fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentsfields - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getIncidentsfields('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
              assert.equal('object', typeof data.response[2]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentsimpactTypes - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getIncidentsimpactTypes('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getIncidentseventTypes - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getIncidentseventTypes('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenances - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getMaintenances('fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenancesid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getMaintenancesid('fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenancesfields - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getMaintenancesfields('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMaintenanceseventTypes - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getMaintenanceseventTypes('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getGeneralMessages - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getGeneralMessages('fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getGeneralMessagesid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getGeneralMessagesid('fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMetricValues - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getMetricValues('fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getMetricValuesid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getMetricValuesid('fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getLocales - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getLocales('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getServices - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getServices('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstances - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        const p = new Promise((resolve) => {
          a.getInstances('fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);

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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstancesstatus - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getInstancesstatus('fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
              assert.equal('object', typeof data.response[2]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstancesstatuspreview - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getInstancesstatuspreview('fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
              assert.equal('object', typeof data.response[2]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceskeystatuspreview - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceskeystatuspreview('fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceskeystatus - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceskeystatus('fakedata', 'fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
              assert.equal('object', typeof data.response[2]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceAliaseskeystatus - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceAliaseskeystatus('fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getInstanceAliaseskey - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getInstanceAliaseskey('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('string', data.response.key);
              assert.equal('string', data.response.instanceKey);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getProducts - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getProducts((data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
              assert.equal('object', typeof data.response[1]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getProductskey - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getProductskey('fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#postSubscribe - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.postSubscribe('fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#patchUnsubscribe - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.patchUnsubscribe('fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#postUnsubscribe - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.postUnsubscribe('fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#postLogin - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.postLogin('fakedata', 'fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('string', data.response.emailAddress);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getLogout - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        const p = new Promise((resolve) => {
          a.getLogout('fakedata', (data, error) => {
            resolve(data);

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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getSubscribers - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getSubscribers('fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#patchSubscribers - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.patchSubscribers('fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#postSubscriberssubscriptionsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.postSubscriberssubscriptionsid('fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#patchSubscriberssubscriptionsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.patchSubscriberssubscriptionsid('fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#deleteSubscriberssubscriptionsid - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.deleteSubscriberssubscriptionsid('fakedata', 'fakedata', 'fakedata', (data, error) => {
            resolve(data);
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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getSearchkey - errors', () => {
      it('should work if integrated or standalone with mockdata', (done) => {
        const p = new Promise((resolve) => {
          a.getSearchkey('fakedata', (data, error) => {
            resolve(data);
            runCommonAsserts(data, error);

            if (stub) {
              assert.equal('object', typeof data.response[0]);
            } else {
              runCommonAsserts(data, error);
            }

            done();
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getTags - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        const p = new Promise((resolve) => {
          a.getTags((data, error) => {
            resolve(data);

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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getTagsinstanceinstanceKey - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        const p = new Promise((resolve) => {
          a.getTagsinstanceinstanceKey('fakedata', 'fakedata', (data, error) => {
            resolve(data);

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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });

    describe('#getTagTypes - errors', () => {
      it('should work if integrated but since no mockdata should error when run standalone', (done) => {
        const p = new Promise((resolve) => {
          a.getTagTypes((data, error) => {
            resolve(data);

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
          });
        });
        // log just done to get rid of const lint issue!
        log.debug(p);
      }).timeout(attemptTimeout);
    });
  });
});
