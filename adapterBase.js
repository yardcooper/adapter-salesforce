/* @copyright Itential, LLC 2018-9 */

// Set globals
/* global log */
/* eslint class-methods-use-this:warn */
/* eslint import/no-dynamic-require: warn */
/* eslint no-loop-func: warn */
/* eslint no-cond-assign: warn */

/* Required libraries.  */
const fs = require('fs-extra');
const path = require('path');
const EventEmitterCl = require('events').EventEmitter;

/* The schema validator */
const AjvCl = require('ajv');

/* Fetch in the other needed components for the this Adaptor */
const PropUtilCl = require('@itentialopensource/adapter-utils').PropertyUtility;
const RequestHandlerCl = require('@itentialopensource/adapter-utils').RequestHandler;

/* GENERAL ADAPTER FUNCTIONS THESE SHOULD NOT BE DIRECTLY MODIFIED */
/* IF YOU NEED MODIFICATIONS, REDEFINE THEM IN adapter.js!!! */
class AdapterBase extends EventEmitterCl {
  /**
   * [System] Adapter
   * @constructor
   */
  constructor(prongid, properties) {
    // Instantiate the EventEmitter super class
    super();

    try {
      // Capture the adapter id
      this.id = prongid;
      this.propUtilInst = new PropUtilCl(prongid, __dirname);

      this.alive = false;
      this.healthy = false;
      this.caching = false;
      this.repeatCacheCount = 0;
      this.allowFailover = 'AD.300';
      this.noFailover = 'AD.500';

      // set up the properties I care about
      this.refreshProperties(properties);

      // Instantiate the other components for this Adapter
      this.requestHandlerInst = new RequestHandlerCl(this.id, this.allProps, __dirname);
    } catch (e) {
      // handle any exception
      const origin = `${this.id}-adapterBase-constructor`;
      log.error(`${origin}: Adapter may not have started properly. ${e}`);
    }
  }


  /**
   * @callback healthCallback
   * @param {Object} result - the result of the get request (contains an id and a status)
   */
  /**
   * @callback getCallback
   * @param {Object} result - the result of the get request (entity/ies)
   * @param {String} error - any error that occured
   */
  /**
   * @callback createCallback
   * @param {Object} item - the newly created entity
   * @param {String} error - any error that occured
   */
  /**
   * @callback updateCallback
   * @param {String} status - the status of the update action
   * @param {String} error - any error that occured
   */
  /**
   * @callback deleteCallback
   * @param {String} status - the status of the delete action
   * @param {String} error - any error that occured
   */


  /**
   * refreshProperties is used to set up all of the properties for the connector.
   * It allows properties to be changed later by simply calling refreshProperties rather
   * than having to restart the connector.
   *
   * @function refreshProperties
   * @param {Object} properties - an object containing all of the properties
   * @param {boolean} init - are we initializing -- is so no need to refresh throtte engine
   */
  refreshProperties(properties) {
    const meth = 'adapterBase-refreshProperties';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    try {
      // Read the properties schema from the file system
      const propertiesSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'propertiesSchema.json'), 'utf-8'));

      // add any defaults to the data
      const defProps = this.propUtilInst.setDefaults(propertiesSchema);
      this.allProps = this.propUtilInst.mergeProperties(properties, defProps);

      // validate the entity against the schema
      const ajvInst = new AjvCl();
      const validate = ajvInst.compile(propertiesSchema);
      const result = validate(this.allProps);

      // if invalid properties throw an error
      if (!result) {
        const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Properties', [JSON.stringify(validate.errors)], null, null, null);
        log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
        throw new Error(JSON.stringify(errorObj));
      }

      // properties that this code cares about
      this.healthcheckType = this.allProps.healthcheck.type;
      this.healthcheckInterval = this.allProps.healthcheck.frequency;

      // set the failover codes from properties
      if (this.allProps.request.failover_codes) {
        if (Array.isArray(this.allProps.request.failover_codes)) {
          this.failoverCodes = this.allProps.request.failover_codes;
        } else {
          this.failoverCodes = [this.allProps.request.failover_codes];
        }
      } else {
        this.failoverCodes = [];
      }

      // set the caching flag from properties
      if (this.allProps.cache_location) {
        if (this.allProps.cache_location === 'redis' || this.allProps.cache_location === 'local') {
          this.caching = true;
        }
      }

      // if this is truly a refresh and we have a request handler, refresh it
      if (this.requestHandlerInst) {
        this.requestHandlerInst.refreshProperties(properties);
      }
    } catch (e) {
      log.error(`${origin}: Properties may not have been set properly. ${e}`);
    }
  }

  /**
   * @summary Connect function is used during Pronghorn startup to provide instantiation feedback.
   *
   * @function connect
   */
  connect() {
    const origin = `${this.id}-adapterBase-connect`;
    log.trace(origin);

    // initially set as off
    this.emit('OFFLINE', { id: this.id });
    this.alive = true;

    // if there is no healthcheck just change the emit to ONLINE
    // We do not recommend no healthcheck!!!
    if (this.healthcheckType === 'none') {
      // validate all of the action files - normally done in healthcheck
      this.emit('ONLINE', { id: this.id });
      this.healthy = true;
    }

    // is the healthcheck only suppose to run on startup
    // (intermittent runs on startup and after that)
    if (this.healthcheckType === 'startup' || this.healthcheckType === 'intermittent') {
      // run an initial healthcheck
      this.healthCheck(null, (status) => {
        log.spam(`${origin}: ${status}`);
      });
    }

    // is the healthcheck suppose to run intermittently
    if (this.healthcheckType === 'intermittent') {
      // run the healthcheck in an interval
      setInterval(() => {
        // try to see if mongo is available
        this.healthCheck(null, (status) => {
          log.spam(`${origin}: ${status}`);
        });
      }, this.healthcheckInterval);
    }
  }

  /**
   * @summary HealthCheck function is used to provide Pronghorn the status of this adapter.
   *
   * @function healthCheck
   */
  healthCheck(reqObj, callback) {
    const origin = `${this.id}-adapterBase-healthCheck`;
    log.trace(origin);

    // call to the healthcheck in connector
    return this.requestHandlerInst.identifyHealthcheck(reqObj, (res, error) => {
      // unhealthy
      if (error) {
        // if we were healthy, toggle health
        if (this.healthy) {
          this.emit('OFFLINE', { id: this.id });
          this.emit('DEGRADED', { id: this.id });
          this.healthy = false;
          log.error(`${origin}: HEALTH CHECK - Error ${error}`);
        } else {
          // still log but set the level to trace
          log.trace(`${origin}: HEALTH CHECK - Still Errors ${error}`);
        }

        return callback(false);
      }

      // if we were unhealthy, toggle health
      if (!this.healthy) {
        this.emit('FIXED', { id: this.id });
        this.emit('ONLINE', { id: this.id });
        this.healthy = true;
        log.info(`${origin}: HEALTH CHECK SUCCESSFUL`);
      } else {
        // still log but set the level to trace
        log.trace(`${origin}: HEALTH CHECK STILL SUCCESSFUL`);
      }

      return callback(true);
    });
  }

  /**
   * getAllFunctions is used to get all of the exposed function in the adapter
   *
   * @function getAllFunctions
   */
  getAllFunctions() {
    let myfunctions = [];
    let obj = this;

    // find the functions in this class
    do {
      const l = Object.getOwnPropertyNames(obj)
        .concat(Object.getOwnPropertySymbols(obj).map(s => s.toString()))
        .sort()
        .filter((p, i, arr) => typeof obj[p] === 'function' && p !== 'constructor' && (i === 0 || p !== arr[i - 1]) && myfunctions.indexOf(p) === -1);
      myfunctions = myfunctions.concat(l);
    }
    while (
      (obj = Object.getPrototypeOf(obj)) && Object.getPrototypeOf(obj)
    );

    return myfunctions;
  }

  /**
   * getWorkflowFunctions is used to get all of the workflow function in the adapter
   *
   * @function getAllFunctions
   */
  getWorkflowFunctions() {
    const myfunctions = this.getAllFunctions();
    const wffunctions = [];

    // remove the functions that should not be in a Workflow
    for (let m = 0; m < myfunctions.length; m += 1) {
      if (myfunctions[m] === 'addEntityCache') {
        // got to the second tier (adapterBase)
        break;
      }
      if (myfunctions[m] !== 'hasEntity' && myfunctions[m] !== 'verifyCapability'
          && myfunctions[m] !== 'updateEntityCache') {
        wffunctions.push(myfunctions[m]);
      }
    }

    return wffunctions;
  }

  /**
   * checkActionFiles is used to update the validation of the action files.
   *
   * @function checkActionFiles
   */
  checkActionFiles() {
    const origin = `${this.id}-adapterBase-checkActionFiles`;
    log.trace(origin);

    // validate the action files for the adapter
    try {
      return this.requestHandlerInst.checkActionFiles();
    } catch (e) {
      return ['Exception increase log level'];
    }
  }

  /**
   * checkProperties is used to validate the adapter properties.
   *
   * @function checkProperties
   * @param {Object} properties - an object containing all of the properties
   */
  checkProperties(properties) {
    const origin = `${this.myid}-adapterBase-checkProperties`;
    log.trace(origin);

    // validate the properties for the adapter
    try {
      return this.requestHandlerInst.checkProperties(properties);
    } catch (e) {
      return { exception: 'Exception increase log level' };
    }
  }

  /**
   * getQueue is used to get information for all of the requests currently in the queue.
   *
   * @function getQueue
   * @param {Callback} callback - a callback function to return the result (Queue) or the error
   */
  getQueue(callback) {
    const origin = `${this.id}-adapterBase-getQueue`;
    log.trace(origin);

    return this.requestHandlerInst.getQueue(callback);
  }

  /**
   * @summary Takes in property text and an encoding/encryption and returns the resulting
   * encoded/encrypted string
   *
   * @function encryptProperty
   * @param {String} property - the property to encrypt
   * @param {String} technique - the technique to use to encrypt
   *
   * @param {Callback} callback - a callback function to return the result
   *                              Encrypted String or the Error
   */
  encryptProperty(property, technique, callback) {
    const origin = `${this.id}-adapterBase-encryptProperty`;
    log.trace(origin);

    // Make the call -
    // encryptProperty(property, technique, callback)
    return this.requestHandlerInst.encryptProperty(property, technique, callback);
  }

  /**
   * @summary take the entities and add them to the cache
   *
   * @function addEntityCache
   * @param {String} entityType - the type of the entities
   * @param {Array} data - the list of entities
   * @param {String} key - unique key for the entities
   *
   * @param {Callback} callback - An array of whether the adapter can has the
   *                              desired capability or an error
   */
  addEntityCache(entityType, entities, key, callback) {
    const meth = 'adapterBase-addEntityCache';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // list containing the items to add to the cache
    const entityIds = [];

    if (entities && Object.hasOwnProperty.call(entities, 'response')
        && Array.isArray(entities.response)) {
      for (let e = 0; e < entities.response.length; e += 1) {
        entityIds.push(entities.response[e][key]);
      }
    }

    // add the entities to the cache
    return this.requestHandlerInst.addEntityCache(entityType, entityIds, (loaded, error) => {
      if (error) {
        return callback(null, error);
      }
      if (!loaded) {
        const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Entity Cache Not Loading', [entityType], null, null, null);
        log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
        return callback(null, errorObj);
      }

      return callback(loaded);
    });
  }

  /**
   * @summary sees if the entity is in the entity list or not
   *
   * @function entityInList
   * @param {String/Array} entityId - the specific entity we are looking for
   * @param {Array} data - the list of entities
   *
   * @param {Callback} callback - An array of whether the adapter can has the
   *                              desired capability or an error
   */
  entityInList(entityId, data) {
    const origin = `${this.id}-adapterBase-entityInList`;
    log.trace(origin);

    // need to check on the entities that were passed in
    if (Array.isArray(entityId)) {
      const resEntity = [];

      for (let e = 0; e < entityId.length; e += 1) {
        if (data.includes(entityId)) {
          resEntity.push(true);
        } else {
          resEntity.push(false);
        }
      }

      return resEntity;
    }

    // does the entity list include the specific entity
    return [data.includes(entityId)];
  }

  /**
   * @summary prepare results for verify capability so they are true/false
   *
   * @function capabilityResults
   * @param {Array} results - the results from the capability check
   *
   * @param {Callback} callback - An array of whether the adapter can has the
   *                              desired capability or an error
   */
  capabilityResults(results, callback) {
    const meth = 'adapterBase-getQueue';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);
    let locResults = results;

    if (locResults && locResults[0] === 'needupdate') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Entity Cache Not Loading', ['unknown'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      this.repeatCacheCount += 1;
      return callback(null, errorObj);
    }

    // if an error occured, return the error
    if (locResults && locResults[0] === 'error') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Error Verifying Entity Cache', null, null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // go through the response and change to true/false
    if (locResults) {
      // if not an array, just convert the return
      if (!Array.isArray(locResults)) {
        if (locResults === 'found') {
          locResults = [true];
        } else {
          locResults = [false];
        }
      } else {
        const temp = [];

        // go through each element in the array to convert
        for (let r = 0; r < locResults.length; r += 1) {
          if (locResults[r] === 'found') {
            temp.push(true);
          } else {
            temp.push(false);
          }
        }
        locResults = temp;
      }
    }

    // return the results
    return callback(locResults);
  }

  /**
   * @summary Provides a way for the adapter to tell north bound integrations
   * all of the capabilities for the current adapter
   *
   * @function getAllCapabilities
   *
   * @return {Array} - containing the entities and the actions available on each entity
   */
  getAllCapabilities() {
    const origin = `${this.id}-adapterBase-getAllCapabilities`;
    log.trace(origin);

    // validate the capabilities for the adapter
    try {
      return this.requestHandlerInst.getAllCapabilities();
    } catch (e) {
      return [];
    }
  }
}

module.exports = AdapterBase;
