/* @copyright Itential, LLC 2018-9 */

// Set globals
/* global log */
/* eslint class-methods-use-this:warn */
/* eslint import/no-dynamic-require: warn */
/* eslint no-loop-func: warn */
/* eslint no-cond-assign: warn */
/* eslint global-require: warn */
/* eslint no-unused-vars: warn */
/* eslint prefer-destructuring: warn */

/* Required libraries.  */
const fs = require('fs-extra');
const path = require('path');
const jsonQuery = require('json-query');
const EventEmitterCl = require('events').EventEmitter;
const { execSync } = require('child_process');

/* The schema validator */
const AjvCl = require('ajv');

/* Fetch in the other needed components for the this Adaptor */
const PropUtilCl = require('@itentialopensource/adapter-utils').PropertyUtility;
const RequestHandlerCl = require('@itentialopensource/adapter-utils').RequestHandler;

const entitiesToDB = require(path.join(__dirname, 'utils/entitiesToDB'));
const troubleshootingAdapter = require(path.join(__dirname, 'utils/troubleshootingAdapter'));
const tbUtils = require(path.join(__dirname, 'utils/tbUtils'));

let propUtil = null;

/*
 * INTERNAL FUNCTION: force fail the adapter - generally done to cause restart
 */
function forceFail(packChg) {
  if (packChg !== undefined && packChg !== null && packChg === true) {
    execSync(`rm -rf ${__dirname}/node modules`, { encoding: 'utf-8' });
    execSync(`rm -rf ${__dirname}/package-lock.json`, { encoding: 'utf-8' });
    execSync('npm install', { encoding: 'utf-8' });
  }
  log.error('NEED TO RESTART ADAPTER - FORCE FAIL');
  const errorObj = {
    origin: 'adapter-forceFail',
    type: 'Force Fail so adapter will restart',
    vars: []
  };
  setTimeout(() => {
    throw new Error(JSON.stringify(errorObj));
  }, 1000);
}

/*
 * INTERNAL FUNCTION: update the action.json
 */
function updateAction(entityPath, action, changes) {
  // if the action file does not exist - error
  const actionFile = path.join(entityPath, '/action.json');
  if (!fs.existsSync(actionFile)) {
    return 'Missing Action File';
  }

  // read in the file as a json object
  const ajson = require(path.resolve(entityPath, 'action.json'));
  let chgAct = {};

  // get the action we need to change
  for (let a = 0; a < ajson.actions.length; a += 1) {
    if (ajson.actions[a].name === action) {
      chgAct = ajson.actions[a];
      break;
    }
  }
  // merge the changes into the desired action
  chgAct = propUtil.mergeProperties(changes, chgAct);

  fs.writeFileSync(actionFile, JSON.stringify(ajson, null, 2));
  return null;
}

/*
 * INTERNAL FUNCTION: update the schema file
 */
function updateSchema(entityPath, configFile, changes) {
  // if the schema file does not exist - error
  const schemaFile = path.join(entityPath, `/${configFile}`);
  if (!fs.existsSync(schemaFile)) {
    return 'Missing Schema File';
  }

  // read in the file as a json object
  let schema = require(path.resolve(entityPath, configFile));

  // merge the changes into the schema file
  schema = propUtil.mergeProperties(changes, schema);

  fs.writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
  return null;
}

/*
 * INTERNAL FUNCTION: update the mock data file
 */
function updateMock(mockPath, configFile, changes) {
  // if the mock file does not exist - create it
  const mockFile = path.join(mockPath, `/${configFile}`);
  if (!fs.existsSync(mockFile)) {
    const newMock = {};
    fs.writeFileSync(mockFile, JSON.stringify(newMock, null, 2));
  }

  // read in the file as a json object
  let mock = require(path.resolve(mockPath, configFile));

  // merge the changes into the mock file
  mock = propUtil.mergeProperties(changes, mock);

  fs.writeFileSync(mockFile, JSON.stringify(mock, null, 2));
  return null;
}

/*
 * INTERNAL FUNCTION: update the package dependencies
 */
function updatePackage(changes) {
  // if the schema file does not exist - error
  const packFile = path.join(__dirname, '/package.json');
  if (!fs.existsSync(packFile)) {
    return 'Missing Pacakge File';
  }

  // read in the file as a json object
  const pack = require(path.resolve(__dirname, 'package.json'));

  // only certain changes are allowed
  if (changes.dependencies) {
    const keys = Object.keys(changes.dependencies);

    for (let k = 0; k < keys.length; k += 1) {
      pack.dependencies[keys[k]] = changes.dependencies[keys[k]];
    }
  }

  fs.writeFileSync(packFile, JSON.stringify(pack, null, 2));
  return null;
}

/*
 * INTERNAL FUNCTION: get data from source(s) - nested
 */
function getDataFromSources(loopField, sources) {
  let fieldValue = loopField;

  // go through the sources to find the field
  for (let s = 0; s < sources.length; s += 1) {
    // find the field value using jsonquery
    const nestedValue = jsonQuery(loopField, { data: sources[s] }).value;

    // if we found in source - set and no need to check other sources
    if (nestedValue) {
      fieldValue = nestedValue;
      break;
    }
  }

  return fieldValue;
}

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

    // IAP home directory injected by core when running the adapter within IAP
    [, , , process.env.iap_home] = process.argv;

    try {
      // Capture the adapter id
      this.id = prongid;
      this.propUtilInst = new PropUtilCl(prongid, __dirname);
      propUtil = this.propUtilInst;
      this.initProps = properties;
      this.alive = false;
      this.healthy = false;
      this.suspended = false;
      this.suspendMode = 'pause';
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
        if (this.requestHandlerInst) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Properties', [JSON.stringify(validate.errors)], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          throw new Error(JSON.stringify(errorObj));
        } else {
          log.error(`${origin}: ${JSON.stringify(validate.errors)}`);
          throw new Error(`${origin}: ${JSON.stringify(validate.errors)}`);
        }
      }

      // properties that this code cares about
      this.healthcheckType = this.allProps.healthcheck.type;
      this.healthcheckInterval = this.allProps.healthcheck.frequency;
      this.healthcheckQuery = this.allProps.healthcheck.query_object;

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
      log.error(`${origin}: Waiting 1 Seconds to emit Online`);
      setTimeout(() => {
        this.emit('ONLINE', { id: this.id });
        this.healthy = true;
      }, 1000);
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

    // if there is healthcheck query_object property, it needs to be added to the adapter
    let myRequest = reqObj;
    if (this.healthcheckQuery && Object.keys(this.healthcheckQuery).length > 0) {
      if (myRequest && myRequest.uriQuery) {
        myRequest.uriQuery = { ...myRequest.uriQuery, ...this.healthcheckQuery };
      } else if (myRequest) {
        myRequest.uriQuery = this.healthcheckQuery;
      } else {
        myRequest = {
          uriQuery: this.healthcheckQuery
        };
      }
    }

    // call to the healthcheck in connector
    return this.requestHandlerInst.identifyHealthcheck(myRequest, (res, error) => {
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
        .concat(Object.getOwnPropertySymbols(obj).map((s) => s.toString()))
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
   * iapGetAdapterWorkflowFunctions is used to get all of the workflow function in the adapter
   * @param {array} ignoreThese - additional methods to ignore (optional)
   *
   * @function iapGetAdapterWorkflowFunctions
   */
  iapGetAdapterWorkflowFunctions(ignoreThese) {
    const myfunctions = this.getAllFunctions();
    const wffunctions = [];

    // remove the functions that should not be in a Workflow
    for (let m = 0; m < myfunctions.length; m += 1) {
      if (myfunctions[m] === 'addEntityCache') {
        // got to the second tier (adapterBase)
        break;
      }
      if (!(myfunctions[m].endsWith('Emit') || myfunctions[m].match(/Emit__v[0-9]+/))) {
        let found = false;
        if (ignoreThese && Array.isArray(ignoreThese)) {
          for (let i = 0; i < ignoreThese.length; i += 1) {
            if (myfunctions[m].toUpperCase() === ignoreThese[i].toUpperCase()) {
              found = true;
            }
          }
        }
        if (!found) {
          wffunctions.push(myfunctions[m]);
        }
      }
    }

    return wffunctions;
  }

  /**
   * iapUpdateAdapterConfiguration is used to update any of the adapter configuration files. This
   * allows customers to make changes to adapter configuration without having to be on the
   * file system.
   *
   * @function iapUpdateAdapterConfiguration
   * @param {string} configFile - the name of the file being updated (required)
   * @param {Object} changes - an object containing all of the changes = formatted like the configuration file (required)
   * @param {string} entity - the entity to be changed, if an action, schema or mock data file (optional)
   * @param {string} type - the type of entity file to change, (action, schema, mock) (optional)
   * @param {string} action - the action to be changed, if an action, schema or mock data file (optional)
   * @param {Callback} callback - The results of the call
   */
  iapUpdateAdapterConfiguration(configFile, changes, entity, type, action, callback) {
    const meth = 'adapterBase-iapUpdateAdapterConfiguration';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // verify the parameters are valid
    if (changes === undefined || changes === null || typeof changes !== 'object'
        || Object.keys(changes).length === 0) {
      const result = {
        response: 'No configuration updates to make'
      };
      log.info(result.response);
      return callback(result, null);
    }
    if (configFile === undefined || configFile === null || configFile === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['configFile'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // take action based on configFile being changed
    if (configFile === 'package.json') {
      const pres = updatePackage(changes);
      if (pres) {
        const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Incomplete Configuration Change: ${pres}`, [], null, null, null);
        log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
        return callback(null, errorObj);
      }
      const result = {
        response: 'Package updates completed - restarting adapter'
      };
      log.info(result.response);
      forceFail(true);
      return callback(result, null);
    }
    if (entity === undefined || entity === null || entity === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Unsupported Configuration Change or Missing Entity', [], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // this means we are changing an entity file so type is required
    if (type === undefined || type === null || type === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['type'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // if the entity does not exist - error
    const epath = `${__dirname}/entities/${entity}`;
    if (!fs.existsSync(epath)) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Incomplete Configuration Change: Invalid Entity - ${entity}`, [], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // take action based on type of file being changed
    if (type === 'action') {
      // BACKUP???
      const ares = updateAction(epath, action, changes);
      if (ares) {
        const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Incomplete Configuration Change: ${ares}`, [], null, null, null);
        log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
        return callback(null, errorObj);
      }
      // AJV CHECK???
      // RESTORE IF NEEDED???
      const result = {
        response: `Action updates completed to entity: ${entity} - ${action}`
      };
      log.info(result.response);
      return callback(result, null);
    }
    if (type === 'schema') {
      const sres = updateSchema(epath, configFile, changes);
      if (sres) {
        const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Incomplete Configuration Change: ${sres}`, [], null, null, null);
        log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
        return callback(null, errorObj);
      }
      const result = {
        response: `Schema updates completed to entity: ${entity} - ${configFile}`
      };
      log.info(result.response);
      return callback(result, null);
    }
    if (type === 'mock') {
      // if the mock directory does not exist - error
      const mpath = `${__dirname}/entities/${entity}/mockdatafiles`;
      if (!fs.existsSync(mpath)) {
        fs.mkdirSync(mpath);
      }

      const mres = updateMock(mpath, configFile, changes);
      if (mres) {
        const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Incomplete Configuration Change: ${mres}`, [], null, null, null);
        log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
        return callback(null, errorObj);
      }
      const result = {
        response: `Mock data updates completed to entity: ${entity} - ${configFile}`
      };
      log.info(result.response);
      return callback(result, null);
    }
    const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Incomplete Configuration Change: Unsupported Type - ${type}`, [], null, null, null);
    log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
    return callback(null, errorObj);
  }

  /**
   * See if the API path provided is found in this adapter
   *
   * @function iapFindAdapterPath
   * @param {string} apiPath - the api path to check on
   * @param {Callback} callback - The results of the call
   */
  iapFindAdapterPath(apiPath, callback) {
    const result = {
      apiPath
    };

    // verify the path was provided
    if (!apiPath) {
      log.error('NO API PATH PROVIDED!');
      result.found = false;
      result.message = 'NO PATH PROVIDED!';
      return callback(null, result);
    }

    // make sure the entities directory exists
    const entitydir = path.join(__dirname, 'entities');
    if (!fs.statSync(entitydir).isDirectory()) {
      log.error('Could not find the entities directory');
      result.found = false;
      result.message = 'Could not find the entities directory';
      return callback(null, result);
    }

    const entities = fs.readdirSync(entitydir);
    const fitems = [];

    // need to go through each entity in the entities directory
    for (let e = 0; e < entities.length; e += 1) {
      // make sure the entity is a directory - do not care about extra files
      // only entities (dir)
      if (fs.statSync(`${entitydir}/${entities[e]}`).isDirectory()) {
        // see if the action file exists in the entity
        if (fs.existsSync(`${entitydir}/${entities[e]}/action.json`)) {
          // Read the entity actions from the file system
          const actions = require(`${entitydir}/${entities[e]}/action.json`);

          // go through all of the actions set the appropriate info in the newActions
          for (let a = 0; a < actions.actions.length; a += 1) {
            if (actions.actions[a].entitypath.indexOf(apiPath) >= 0) {
              log.info(`  Found - entity: ${entities[e]} action: ${actions.actions[a].name}`);
              log.info(`          method: ${actions.actions[a].method} path: ${actions.actions[a].entitypath}`);
              const fitem = {
                entity: entities[e],
                action: actions.actions[a].name,
                method: actions.actions[a].method,
                path: actions.actions[a].entitypath
              };
              fitems.push(fitem);
            }
          }
        } else {
          log.error(`Could not find entities ${entities[e]} action.json file`);
          result.found = false;
          result.message = `Could not find entities ${entities[e]} action.json file`;
          return callback(null, result);
        }
      } else {
        log.error(`Could not find entities ${entities[e]} directory`);
        result.found = false;
        result.message = `Could not find entities ${entities[e]} directory`;
        return callback(null, result);
      }
    }

    if (fitems.length === 0) {
      log.info('PATH NOT FOUND!');
      result.found = false;
      result.message = 'API PATH NOT FOUND!';
      return callback(null, result);
    }

    result.foundIn = fitems;
    result.found = true;
    result.message = 'API PATH FOUND!';
    return callback(result, null);
  }

  /**
   * @summary Suspends the adapter
   * @param {Callback} callback - The adapater suspension status
   * @function iapSuspendAdapter
   */
  iapSuspendAdapter(mode, callback) {
    const origin = `${this.id}-adapterBase-iapSuspendAdapter`;
    if (this.suspended) {
      throw new Error(`${origin}: Adapter is already suspended`);
    }
    try {
      this.suspended = true;
      this.suspendMode = mode;
      if (this.suspendMode === 'pause') {
        const props = JSON.parse(JSON.stringify(this.initProps));
        // To suspend adapter, enable throttling and set concurrent max to 0
        props.throttle.throttle_enabled = true;
        props.throttle.concurrent_max = 0;
        this.refreshProperties(props);
      }
      return callback({ suspended: true });
    } catch (error) {
      return callback(null, error);
    }
  }

  /**
   * @summary Unsuspends the adapter
   * @param {Callback} callback - The adapater suspension status
   *
   * @function iapUnsuspendAdapter
   */
  iapUnsuspendAdapter(callback) {
    const origin = `${this.id}-adapterBase-iapUnsuspendAdapter`;
    if (!this.suspended) {
      throw new Error(`${origin}: Adapter is not suspended`);
    }
    if (this.suspendMode === 'pause') {
      const props = JSON.parse(JSON.stringify(this.initProps));
      // To unsuspend adapter, keep throttling enabled and begin processing queued requests in order
      props.throttle.throttle_enabled = true;
      props.throttle.concurrent_max = 1;
      this.refreshProperties(props);
      setTimeout(() => {
        this.getQueue((q, error) => {
          // console.log("Items in queue: " + String(q.length))
          if (q.length === 0) {
            // if queue is empty, return to initial properties state
            this.refreshProperties(this.initProps);
            this.suspended = false;
            return callback({ suspended: false });
          }
          // recursive call to check queue again every second
          return this.iapUnsuspendAdapter(callback);
        });
      }, 1000);
    } else {
      this.suspended = false;
      callback({ suspend: false });
    }
  }

  /**
   * iapGetAdapterQueue is used to get information for all of the requests currently in the queue.
   *
   * @function iapGetAdapterQueue
   * @param {Callback} callback - a callback function to return the result (Queue) or the error
   */
  iapGetAdapterQueue(callback) {
    const origin = `${this.id}-adapterBase-iapGetAdapterQueue`;
    log.trace(origin);

    return this.requestHandlerInst.getQueue(callback);
  }

  /**
   * @summary runs troubleshoot scripts for adapter
   *
   * @function iapTroubleshootAdapter
   * @param {Object} props - the connection, healthcheck and authentication properties
   * @param {boolean} persistFlag - whether the adapter properties should be updated
   * @param {Adapter} adapter - adapter instance to troubleshoot
   * @param {Callback} callback - callback function to return troubleshoot results
   */
  async iapTroubleshootAdapter(props, persistFlag, adapter, callback) {
    try {
      const result = await troubleshootingAdapter.troubleshoot(props, false, persistFlag, adapter);
      if (result.healthCheck && result.connectivity.failCount === 0 && result.basicGet.failCount === 0) {
        return callback(result);
      }
      return callback(null, result);
    } catch (error) {
      return callback(null, error);
    }
  }

  /**
   * @summary runs healthcheck script for adapter
   *
   * @function iapRunAdapterHealthcheck
   * @param {Adapter} adapter - adapter instance to troubleshoot
   * @param {Callback} callback - callback function to return healthcheck status
   */
  async iapRunAdapterHealthcheck(adapter, callback) {
    try {
      const result = await tbUtils.healthCheck(adapter);
      if (result) {
        return callback(result);
      }
      return callback(null, result);
    } catch (error) {
      return callback(null, error);
    }
  }

  /**
   * @summary runs connectivity check script for adapter
   *
   * @function iapRunAdapterConnectivity
   * @param {Adapter} adapter - adapter instance to troubleshoot
   * @param {Callback} callback - callback function to return connectivity status
   */
  async iapRunAdapterConnectivity(callback) {
    try {
      const { serviceItem } = await tbUtils.getAdapterConfig();
      const { host } = serviceItem.properties.properties;
      const result = tbUtils.runConnectivity(host, false);
      if (result.failCount > 0) {
        return callback(null, result);
      }
      return callback(result);
    } catch (error) {
      return callback(null, error);
    }
  }

  /**
   * @summary runs basicGet script for adapter
   *
   * @function iapRunAdapterBasicGet
   * @param {Callback} callback - callback function to return basicGet result
   */
  iapRunAdapterBasicGet(callback) {
    try {
      const result = tbUtils.runBasicGet(false);
      if (result.failCount > 0) {
        return callback(null, result);
      }
      return callback(result);
    } catch (error) {
      return callback(null, error);
    }
  }

  /**
   * @summary moves entities to mongo database
   *
   * @function iapMoveAdapterEntitiesToDB
   *
   * @return {Callback} - containing the response from the mongo transaction
   */
  async iapMoveAdapterEntitiesToDB(callback) {
    const meth = 'adapterBase-iapMoveAdapterEntitiesToDB';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    try {
      const result = await entitiesToDB.moveEntitiesToDB(__dirname, { pronghornProps: this.allProps, id: this.id });
      return callback(result, null);
    } catch (err) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, err);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, err.message);
    }
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
        if (data.includes(entityId[e])) {
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
    const meth = 'adapterBase-capabilityResults';
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

  /**
   * @summary Determines if this adapter supports any in a list of entities
   *
   * @function hasEntities
   * @param {String} entityType - the entity type to check for
   * @param {Array} entityList - the list of entities we are looking for
   *
   * @param {Callback} callback - A map where the entity is the key and the
   *                              value is true or false
   */
  hasEntities(entityType, entityList, callback) {
    const origin = `${this.id}-adapter-hasEntities`;
    log.trace(origin);

    switch (entityType) {
      case 'Device':
        return this.hasDevices(entityList, callback);
      default:
        return callback(null, `${this.id} does not support entity ${entityType}`);
    }
  }

  /**
   * @summary Helper method for hasEntities for the specific device case
   *
   * @param {Array} deviceList - array of unique device identifiers
   * @param {Callback} callback - A map where the device is the key and the
   *                              value is true or false
   */
  hasDevices(deviceList, callback) {
    const origin = `${this.id}-adapter-hasDevices`;
    log.trace(origin);

    const findings = deviceList.reduce((map, device) => {
      // eslint-disable-next-line no-param-reassign
      map[device] = false;
      log.debug(`In reduce: ${JSON.stringify(map)}`);
      return map;
    }, {});
    const apiCalls = deviceList.map((device) => new Promise((resolve) => {
      this.getDevice(device, (result, error) => {
        if (error) {
          log.debug(`In map error: ${JSON.stringify(device)}`);
          return resolve({ name: device, found: false });
        }
        log.debug(`In map: ${JSON.stringify(device)}`);
        return resolve({ name: device, found: true });
      });
    }));
    Promise.all(apiCalls).then((results) => {
      results.forEach((device) => {
        findings[device.name] = device.found;
      });
      log.debug(`FINDINGS: ${JSON.stringify(findings)}`);
      return callback(findings);
    }).catch((errors) => {
      log.error('Unable to do device lookup.');
      return callback(null, { code: 503, message: 'Unable to do device lookup.', error: errors });
    });
  }

  /**
   * @summary Make one of the needed Broker calls - could be one of many
   *
   * @function iapMakeBrokerCall
   * @param {string} brokCall - the name of the broker call (required)
   * @param {object} callProps - the proeprties for the broker call (required)
   * @param {object} devResp - the device details to extract needed inputs (required)
   * @param {string} filterName - any filter to search on (required)
   *
   * @param {getCallback} callback - a callback function to return the result of the call
   */
  iapMakeBrokerCall(brokCall, callProps, devResp, filterName, callback) {
    const meth = 'adapterBase-iapMakeBrokerCall';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    try {
      let uriPath = '';
      let uriMethod = 'GET';
      let callQuery = {};
      let callBody = {};
      let callHeaders = {};
      let handleFail = 'fail';
      let ostypePrefix = '';
      let statusValue = 'true';
      if (callProps.path) {
        uriPath = `${callProps.path}`;

        // make any necessary changes to the path
        if (devResp !== null && callProps.requestFields && Object.keys(callProps.requestFields).length > 0) {
          const rqKeys = Object.keys(callProps.requestFields);

          // get the field from the provided device
          for (let rq = 0; rq < rqKeys.length; rq += 1) {
            const fieldValue = getDataFromSources(callProps.requestFields[rqKeys[rq]], devResp);

            // put the value into the path - if it has been specified in the path
            uriPath = uriPath.replace(`{${rqKeys[rq]}}`, fieldValue);
          }
        }
      }
      if (callProps.method) {
        uriMethod = callProps.method;
      }
      if (callProps.query) {
        callQuery = callProps.query;

        // go through the query params to check for variable values
        const cpKeys = Object.keys(callQuery);
        for (let cp = 0; cp < cpKeys.length; cp += 1) {
          if (callQuery[cpKeys[cp]].startsWith('{') && callQuery[cpKeys[cp]].endsWith('}')) {
            // make any necessary changes to the query params
            if (devResp !== null && callProps.requestFields && Object.keys(callProps.requestFields).length > 0) {
              const rqKeys = Object.keys(callProps.requestFields);

              // get the field from the provided device
              for (let rq = 0; rq < rqKeys.length; rq += 1) {
                if (cpKeys[cp] === rqKeys[rq]) {
                  const fieldValue = getDataFromSources(callProps.requestFields[rqKeys[rq]], devResp);

                  // put the value into the query - if it has been specified in the query
                  callQuery[cpKeys[cp]] = fieldValue;
                }
              }
            }
          }
        }
      }
      if (callProps.body) {
        callBody = callProps.body;

        // go through the body fields to check for variable values
        const cbKeys = Object.keys(callBody);
        for (let cb = 0; cb < cbKeys.length; cb += 1) {
          if (callBody[cbKeys[cb]].startsWith('{') && callBody[cbKeys[cb]].endsWith('}')) {
            // make any necessary changes to the query params
            if (devResp !== null && callProps.requestFields && Object.keys(callProps.requestFields).length > 0) {
              const rqKeys = Object.keys(callProps.requestFields);

              // get the field from the provided device
              for (let rq = 0; rq < rqKeys.length; rq += 1) {
                if (cbKeys[cb] === rqKeys[rq]) {
                  const fieldValue = getDataFromSources(callProps.requestFields[rqKeys[rq]], devResp);

                  // put the value into the query - if it has been specified in the query
                  callBody[cbKeys[cb]] = fieldValue;
                }
              }
            }
          }
        }
      }
      if (callProps.headers) {
        callHeaders = callProps.headers;

        // go through the body fields to check for variable values
        const chKeys = Object.keys(callHeaders);
        for (let ch = 0; ch < chKeys.length; ch += 1) {
          if (callHeaders[chKeys[ch]].startsWith('{') && callHeaders[chKeys[ch]].endsWith('}')) {
            // make any necessary changes to the query params
            if (devResp !== null && callProps.requestFields && Object.keys(callProps.requestFields).length > 0) {
              const rqKeys = Object.keys(callProps.requestFields);

              // get the field from the provided device
              for (let rq = 0; rq < rqKeys.length; rq += 1) {
                if (chKeys[ch] === rqKeys[rq]) {
                  const fieldValue = getDataFromSources(callProps.requestFields[rqKeys[rq]], devResp);

                  // put the value into the query - if it has been specified in the query
                  callHeaders[chKeys[ch]] = fieldValue;
                }
              }
            }
          }
        }
      }
      if (callProps.handleFailure) {
        handleFail = callProps.handleFailure;
      }
      if (callProps.responseFields && callProps.responseFields.ostypePrefix) {
        ostypePrefix = callProps.responseFields.ostypePrefix;
      }
      if (callProps.responseFields && callProps.responseFields.statusValue) {
        statusValue = callProps.responseFields.statusValue;
      }

      // !! using Generic makes it easier on the Adapter Builder (just need to change the path)
      // !! you can also replace with a specific call if that is easier
      return this.genericAdapterRequest(uriPath, uriMethod, callQuery, callBody, callHeaders, (result, error) => {
        // if we received an error or their is no response on the results return an error
        if (error) {
          if (handleFail === 'fail') {
            return callback(null, error);
          }
          return callback({}, null);
        }
        if (!result.response) {
          if (handleFail === 'fail') {
            const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', [brokCall], null, null, null);
            log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
            return callback(null, errorObj);
          }
          return callback({}, null);
        }

        // get the response piece we care about from the response
        const myResult = result;
        if (callProps.responseDatakey) {
          myResult.response = jsonQuery(callProps.responseDatakey, { data: myResult.response }).value;
        }

        // get the keys for the response fields
        let rfKeys = [];
        if (callProps.responseFields && Object.keys(callProps.responseFields).length > 0) {
          rfKeys = Object.keys(callProps.responseFields);
        }

        // if we got an array returned (e.g. getDevicesFitered)
        if (Array.isArray(myResult.response)) {
          const listDevices = [];
          for (let a = 0; a < myResult.response.length; a += 1) {
            const thisDevice = myResult.response[a];
            for (let rf = 0; rf < rfKeys.length; rf += 1) {
              if (rfKeys[rf] !== 'ostypePrefix') {
                let fieldValue = getDataFromSources(callProps.responseFields[rfKeys[rf]], [thisDevice, devResp, callProps.requestFields]);

                // if the field is ostype - need to add prefix
                if (rfKeys[rf] === 'ostype' && typeof fieldValue === 'string') {
                  fieldValue = ostypePrefix + fieldValue;
                }
                // if there is a status to set, set it
                if (rfKeys[rf] === 'status') {
                  // if really looking for just a good response
                  if (callProps.responseFields[rfKeys[rf]] === 'return2xx' && myResult.icode === statusValue.toString()) {
                    thisDevice.isAlive = true;
                  } else if (fieldValue.toString() === statusValue.toString()) {
                    thisDevice.isAlive = true;
                  } else {
                    thisDevice.isAlive = false;
                  }
                }
                // if we found a good value
                thisDevice[rfKeys[rf]] = fieldValue;
              }
            }

            // if there is no filter - add the device to the list
            if (!filterName || filterName.length === 0) {
              listDevices.push(thisDevice);
            } else {
              // if we have to match a filter
              let found = false;
              for (let f = 0; f < filterName.length; f += 1) {
                if (thisDevice.name.indexOf(filterName[f]) >= 0) {
                  found = true;
                  break;
                }
              }
              // matching device
              if (found) {
                listDevices.push(thisDevice);
              }
            }
          }

          // return the array of devices
          return callback(listDevices, null);
        }

        // if this is not an array - just about everything else, just handle as a single object
        let thisDevice = myResult.response;
        for (let rf = 0; rf < rfKeys.length; rf += 1) {
          // skip ostypePrefix since it is not a field
          if (rfKeys[rf] !== 'ostypePrefix') {
            let fieldValue = getDataFromSources(callProps.responseFields[rfKeys[rf]], [thisDevice, devResp, callProps.requestFields]);

            // if the field is ostype - need to add prefix
            if (rfKeys[rf] === 'ostype' && typeof fieldValue === 'string') {
              fieldValue = ostypePrefix + fieldValue;
            }
            // if there is a status to set, set it
            if (rfKeys[rf] === 'status') {
              // if really looking for just a good response
              if (callProps.responseFields[rfKeys[rf]] === 'return2xx' && myResult.icode === statusValue.toString()) {
                thisDevice.isAlive = true;
              } else if (fieldValue.toString() === statusValue.toString()) {
                thisDevice.isAlive = true;
              } else {
                thisDevice.isAlive = false;
              }
            }
            // if we found a good value
            thisDevice[rfKeys[rf]] = fieldValue;
          }
        }

        // if there is a filter - check the device is in the list
        if (filterName && filterName.length > 0) {
          let found = false;
          for (let f = 0; f < filterName.length; f += 1) {
            if (thisDevice.name.indexOf(filterName[f]) >= 0) {
              found = true;
              break;
            }
          }
          // no matching device - clear the device
          if (!found) {
            thisDevice = {};
          }
        }

        return callback(thisDevice, null);
      });
    } catch (e) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, e);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Get Appliance that match the deviceName
   *
   * @function getDevice
   * @param {String} deviceName - the deviceName to find (required)
   *
   * @param {getCallback} callback - a callback function to return the result
   *                                 (appliance) or the error
   */
  getDevice(deviceName, callback) {
    const meth = 'adapterBase-getDevice';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // make sure we are set up for device broker getDevice
    if (!this.allProps.devicebroker || !this.allProps.devicebroker.getDevice || this.allProps.devicebroker.getDevice.length === 0 || !this.allProps.devicebroker.getDevice[0].path) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Properties', ['devicebroker.getDevice.path'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (deviceName === undefined || deviceName === null || deviceName === '' || deviceName.length === 0) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['deviceName'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    try {
      // need to get the device so we can convert the deviceName to an id
      // !! if we can do a lookup by name the getDevicesFiltered may not be necessary
      const opts = {
        filter: {
          name: deviceName
        }
      };
      return this.getDevicesFiltered(opts, (devs, ferr) => {
        // if we received an error or their is no response on the results return an error
        if (ferr) {
          return callback(null, ferr);
        }
        if (devs.list.length < 1) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Did Not Find Device ${deviceName}`, [], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        const callPromises = [];
        for (let i = 0; i < this.allProps.devicebroker.getDevice.length; i += 1) {
          // Perform component calls here.
          callPromises.push(
            new Promise((resolve, reject) => {
              this.iapMakeBrokerCall('getDevice', this.allProps.devicebroker.getDevice[i], [devs.list[0]], null, (callRet, callErr) => {
                // return an error
                if (callErr) {
                  reject(callErr);
                } else {
                  // return the data
                  resolve(callRet);
                }
              });
            })
          );
        }

        // return an array of repsonses
        return Promise.all(callPromises).then((results) => {
          let myResult = {};
          results.forEach((result) => {
            myResult = { ...myResult, ...result };
          });

          return callback(myResult, null);
        });
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Get Appliances that match the filter
   *
   * @function getDevicesFiltered
   * @param {Object} options - the data to use to filter the appliances (optional)
   *
   * @param {getCallback} callback - a callback function to return the result
   *                                 (appliances) or the error
   */
  getDevicesFiltered(options, callback) {
    const meth = 'adapterBase-getDevicesFiltered';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // make sure we are set up for device broker getDevicesFiltered
    if (!this.allProps.devicebroker || !this.allProps.devicebroker.getDevicesFiltered || this.allProps.devicebroker.getDevicesFiltered.length === 0 || !this.allProps.devicebroker.getDevicesFiltered[0].path) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Properties', ['devicebroker.getDevicesFiltered.path'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // verify the required fields have been provided
    if (options === undefined || options === null || options === '' || options.length === 0) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['options'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    log.debug(`Device Filter Options: ${JSON.stringify(options)}`);

    try {
      // TODO - get pagination working
      // const nextToken = options.start;
      // const maxResults = options.limit;

      // set up the filter of Device Names
      let filterName = [];
      if (options && options.filter && options.filter.name) {
        // when this hack is removed, remove the lint ignore above
        if (Array.isArray(options.filter.name)) {
          // eslint-disable-next-line prefer-destructuring
          filterName = options.filter.name;
        } else {
          filterName = [options.filter.name];
        }
      }

      // TODO - get sort and order working
      /*
      if (options && options.sort) {
        reqObj.uriOptions.sort = JSON.stringify(options.sort);
      }
      if (options && options.order) {
        reqObj.uriOptions.order = options.order;
      }
      */
      const callPromises = [];
      for (let i = 0; i < this.allProps.devicebroker.getDevicesFiltered.length; i += 1) {
        // Perform component calls here.
        callPromises.push(
          new Promise((resolve, reject) => {
            this.iapMakeBrokerCall('getDevicesFiltered', this.allProps.devicebroker.getDevicesFiltered[i], [{ fake: 'fakedata' }], filterName, (callRet, callErr) => {
              // return an error
              if (callErr) {
                reject(callErr);
              } else {
                // return the data
                resolve(callRet);
              }
            });
          })
        );
      }

      // return an array of repsonses
      return Promise.all(callPromises).then((results) => {
        let myResult = [];
        results.forEach((result) => {
          if (Array.isArray(result)) {
            myResult = [...myResult, ...result];
          } else if (Object.keys(result).length > 0) {
            myResult.push(result);
          }
        });

        log.debug(`${origin}: Found #${myResult.length} devices.`);
        log.debug(`Devices: ${JSON.stringify(myResult)}`);
        return callback({ total: myResult.length, list: myResult });
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Gets the status for the provided appliance
   *
   * @function isAlive
   * @param {String} deviceName - the deviceName of the appliance. (required)
   *
   * @param {configCallback} callback - callback function to return the result
   *                                    (appliance isAlive) or the error
   */
  isAlive(deviceName, callback) {
    const meth = 'adapterBase-isAlive';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // make sure we are set up for device broker isAlive
    if (!this.allProps.devicebroker || !this.allProps.devicebroker.isAlive || this.allProps.devicebroker.isAlive.length === 0 || !this.allProps.devicebroker.isAlive[0].path) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Properties', ['devicebroker.isAlive.path'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // verify the required fields have been provided
    if (deviceName === undefined || deviceName === null || deviceName === '' || deviceName.length === 0) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['deviceName'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    try {
      // need to get the device so we can convert the deviceName to an id
      // !! if we can do a lookup by name the getDevicesFiltered may not be necessary
      const opts = {
        filter: {
          name: deviceName
        }
      };
      return this.getDevicesFiltered(opts, (devs, ferr) => {
        // if we received an error or their is no response on the results return an error
        if (ferr) {
          return callback(null, ferr);
        }
        if (devs.list.length < 1) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Did Not Find Device ${deviceName}`, [], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        const callPromises = [];
        for (let i = 0; i < this.allProps.devicebroker.isAlive.length; i += 1) {
          // Perform component calls here.
          callPromises.push(
            new Promise((resolve, reject) => {
              this.iapMakeBrokerCall('isAlive', this.allProps.devicebroker.isAlive[i], [devs.list[0]], null, (callRet, callErr) => {
                // return an error
                if (callErr) {
                  reject(callErr);
                } else {
                  // return the data
                  resolve(callRet);
                }
              });
            })
          );
        }

        // return an array of repsonses
        return Promise.all(callPromises).then((results) => {
          let myResult = {};
          results.forEach((result) => {
            myResult = { ...myResult, ...result };
          });

          let response = true;
          if (myResult.isAlive !== null && myResult.isAlive !== undefined && myResult.isAlive === false) {
            response = false;
          }
          return callback(response);
        });
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Gets a config for the provided Appliance
   *
   * @function getConfig
   * @param {String} deviceName - the deviceName of the appliance. (required)
   * @param {String} format - the desired format of the config. (optional)
   *
   * @param {configCallback} callback - callback function to return the result
   *                                    (appliance config) or the error
   */
  getConfig(deviceName, format, callback) {
    const meth = 'adapterBase-getConfig';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // make sure we are set up for device broker getConfig
    if (!this.allProps.devicebroker || !this.allProps.devicebroker.getConfig || this.allProps.devicebroker.getConfig.length === 0 || !this.allProps.devicebroker.getConfig[0].path) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Properties', ['devicebroker.getConfig.path'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // verify the required fields have been provided
    if (deviceName === undefined || deviceName === null || deviceName === '' || deviceName.length === 0) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['deviceName'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    try {
      // need to get the device so we can convert the deviceName to an id
      // !! if we can do a lookup by name the getDevicesFiltered may not be necessary
      const opts = {
        filter: {
          name: deviceName
        }
      };
      return this.getDevicesFiltered(opts, (devs, ferr) => {
        // if we received an error or their is no response on the results return an error
        if (ferr) {
          return callback(null, ferr);
        }
        if (devs.list.length < 1) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, `Did Not Find Device ${deviceName}`, [], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        const callPromises = [];
        for (let i = 0; i < this.allProps.devicebroker.getConfig.length; i += 1) {
          // Perform component calls here.
          callPromises.push(
            new Promise((resolve, reject) => {
              this.iapMakeBrokerCall('getConfig', this.allProps.devicebroker.getConfig[i], [devs.list[0]], null, (callRet, callErr) => {
                // return an error
                if (callErr) {
                  reject(callErr);
                } else {
                  // return the data
                  resolve(callRet);
                }
              });
            })
          );
        }

        // return an array of repsonses
        return Promise.all(callPromises).then((results) => {
          let myResult = {};
          results.forEach((result) => {
            myResult = { ...myResult, ...result };
          });

          // return the result
          const newResponse = {
            response: JSON.stringify(myResult, null, 2)
          };
          return callback(newResponse, null);
        });
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Gets the device count from the system
   *
   * @function iapGetDeviceCount
   *
   * @param {getCallback} callback - callback function to return the result
   *                                    (count) or the error
   */
  iapGetDeviceCount(callback) {
    const meth = 'adapterBase-iapGetDeviceCount';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // make sure we are set up for device broker getCount
    if (!this.allProps.devicebroker || !this.allProps.devicebroker.getCount || this.allProps.devicebroker.getCount.length === 0 || !this.allProps.devicebroker.getCount[0].path) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Properties', ['devicebroker.getCount.path'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    // verify the required fields have been provided

    try {
      const callPromises = [];
      for (let i = 0; i < this.allProps.devicebroker.getCount.length; i += 1) {
        // Perform component calls here.
        callPromises.push(
          new Promise((resolve, reject) => {
            this.iapMakeBrokerCall('getCount', this.allProps.devicebroker.getCount[i], null, null, (callRet, callErr) => {
              // return an error
              if (callErr) {
                reject(callErr);
              } else {
                // return the data
                resolve(callRet);
              }
            });
          })
        );
      }

      // return an array of repsonses
      return Promise.all(callPromises).then((results) => {
        let myResult = {};
        results.forEach((result) => {
          myResult = { ...myResult, ...result };
        });

        // return the result
        return callback({ count: myResult.length });
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }
}

module.exports = AdapterBase;
