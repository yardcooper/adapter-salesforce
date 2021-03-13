/* @copyright Itential, LLC 2018-9 */

// Set globals
/* global log */
/* eslint class-methods-use-this:warn */
/* eslint import/no-dynamic-require: warn */
/* eslint no-loop-func: warn */
/* eslint no-cond-assign: warn */
/* eslint global-require: warn */
/* eslint no-unused-vars: warn */

/* Required libraries.  */
const fs = require('fs-extra');
const path = require('path');
const EventEmitterCl = require('events').EventEmitter;
const { execSync } = require('child_process');

/* The schema validator */
const AjvCl = require('ajv');

/* Fetch in the other needed components for the this Adaptor */
const PropUtilCl = require('@itentialopensource/adapter-utils').PropertyUtility;
const RequestHandlerCl = require('@itentialopensource/adapter-utils').RequestHandler;

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
   * updateAdapterConfiguration is used to update any of the adapter configuration files. This
   * allows customers to make changes to adapter configuration without having to be on the
   * file system.
   *
   * @function updateAdapterConfiguration
   * @param {string} configFile - the name of the file being updated (required)
   * @param {Object} changes - an object containing all of the changes = formatted like the configuration file (required)
   * @param {string} entity - the entity to be changed, if an action, schema or mock data file (optional)
   * @param {string} type - the type of entity file to change, (action, schema, mock) (optional)
   * @param {string} action - the action to be changed, if an action, schema or mock data file (optional)
   * @param {Callback} callback - The results of the call
   */
  updateAdapterConfiguration(configFile, changes, entity, type, action, callback) {
    const meth = 'adapterBase-updateAdapterConfiguration';
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
   * @summary Suspends the adapter
   * @param {Callback} callback - The adapater suspension status
   * @function suspend
   */
  suspend(mode, callback) {
    const origin = `${this.id}-adapterBase-suspend`;
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
   * @function unsuspend
   */
  unsuspend(callback) {
    const origin = `${this.id}-adapterBase-unsuspend`;
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
          return this.unsuspend(callback);
        });
      }, 1000);
    } else {
      this.suspended = false;
      callback({ suspend: false });
    }
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
   * getWorkflowFunctions is used to get all of the workflow function in the adapter
   * @param {array} ignoreThese - additional methods to ignore (optional)
   *
   * @function getWorkflowFunctions
   */
  getWorkflowFunctions(ignoreThese) {
    const myfunctions = this.getAllFunctions();
    const wffunctions = [];

    // remove the functions that should not be in a Workflow
    for (let m = 0; m < myfunctions.length; m += 1) {
      if (myfunctions[m] === 'addEntityCache') {
        // got to the second tier (adapterBase)
        break;
      }
      if (myfunctions[m] !== 'hasEntity' && myfunctions[m] !== 'verifyCapability' && myfunctions[m] !== 'updateEntityCache'
          && myfunctions[m] !== 'healthCheck' && myfunctions[m] !== 'getWorkflowFunctions'
          && !(myfunctions[m].endsWith('Emit') || myfunctions[m].match(/Emit__v[0-9]+/))) {
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
   * See if the API path provided is found in this adapter
   *
   * @function findPath
   * @param {string} apiPath - the api path to check on
   * @param {Callback} callback - The results of the call
   */
  findPath(apiPath, callback) {
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
   * @summary runs troubleshoot scripts for adapter
   *
   * @function troubleshoot
   * @param {Object} props - the connection, healthcheck and authentication properties
   * @param {boolean} persistFlag - whether the adapter properties should be updated
   * @param {Adapter} adapter - adapter instance to troubleshoot
   * @param {Callback} callback - callback function to return troubleshoot results
   */
  async troubleshoot(props, persistFlag, adapter, callback) {
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
   * @function runHealthcheck
   * @param {Adapter} adapter - adapter instance to troubleshoot
   * @param {Callback} callback - callback function to return healthcheck status
   */
  async runHealthcheck(adapter, callback) {
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
   * @function runConnectivity
   * @param {Adapter} adapter - adapter instance to troubleshoot
   * @param {Callback} callback - callback function to return connectivity status
   */
  async runConnectivity(callback) {
    try {
      const { serviceItem } = await troubleshootingAdapter.getAdapterConfig();
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
   * @function runBasicGet
   * @param {Callback} callback - callback function to return basicGet result
   */
  runBasicGet(callback) {
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
}

module.exports = AdapterBase;
