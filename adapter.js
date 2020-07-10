/* @copyright Itential, LLC 2019 */

/* eslint import/no-dynamic-require: warn */
/* eslint object-curly-newline: warn */
/* eslint no-underscore-dangle: warn  */
/* eslint camelcase: warn  */

// Set globals
/* global log */

/* Required libraries.  */
const path = require('path');

/* Fetch in the other needed components for the this Adaptor */
const AdapterBaseCl = require(path.join(__dirname, 'adapterBase.js'));

/**
 * This is the adapter/interface into Salesforce
 */

/* GENERAL ADAPTER FUNCTIONS */
class Salesforce extends AdapterBaseCl {
  /**
   * Salesforce Adapter
   * @constructor
   */
  /* Working on changing the way we do Emit methods due to size and time constrainsts
  constructor(prongid, properties) {
    // Instantiate the AdapterBase super class
    super(prongid, properties);

    const restFunctionNames = this.getWorkflowFunctions();

    // Dynamically bind emit functions
    for (let i = 0; i < restFunctionNames.length; i += 1) {
      // Bind function to have name fnNameEmit for fnName
      const version = restFunctionNames[i].match(/__v[0-9]+/);
      const baseFnName = restFunctionNames[i].replace(/__v[0-9]+/, '');
      const fnNameEmit = version ? `${baseFnName}Emit${version}` : `${baseFnName}Emit`;
      this[fnNameEmit] = function (...args) {
        // extract the callback
        const callback = args[args.length - 1];
        // slice the callback from args so we can insert our own
        const functionArgs = args.slice(0, args.length - 1);
        // create a random name for the listener
        const eventName = `${restFunctionNames[i]}:${Math.random().toString(36)}`;
        // tell the calling class to start listening
        callback({ event: eventName, status: 'received' });
        // store parent for use of this context later
        const parent = this;
        // store emission function
        const func = function (val, err) {
          parent.removeListener(eventName, func);
          parent.emit(eventName, val, err);
        };
        // Use apply to call the function in a specific context
        this[restFunctionNames[i]].apply(this, functionArgs.concat([func])); // eslint-disable-line prefer-spread
      };
    }

    // Uncomment if you have things to add to the constructor like using your own properties.
    // Otherwise the constructor in the adapterBase will be used.
    // Capture my own properties - they need to be defined in propertiesSchema.json
    // if (this.allProps && this.allProps.myownproperty) {
    //   mypropvariable = this.allProps.myownproperty;
    // }
  }
  */

  /**
   * @callback healthCallback
   * @param {Object} reqObj - the request to send into the healthcheck
   * @param {Callback} callback - The results of the call
   */
  healthCheck(reqObj, callback) {
    // you can modify what is passed into the healthcheck by changing things in the newReq
    let newReq = null;
    if (reqObj) {
      newReq = Object.assign(...reqObj);
    }
    super.healthCheck(newReq, callback);
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
    super.updateAdapterConfiguration(configFile, changes, entity, type, action, callback);
  }

  /**
   * @callback healthCallback
   * @param {Object} result - the result of the get request (contains an id and a status)
   */
  /**
   * @callback getCallback
   * @param {Object} result - the result of the get request (entity/ies)
   * @param {String} error - any error that occurred
   */
  /**
   * @callback createCallback
   * @param {Object} item - the newly created entity
   * @param {String} error - any error that occurred
   */
  /**
   * @callback updateCallback
   * @param {String} status - the status of the update action
   * @param {String} error - any error that occurred
   */
  /**
   * @callback deleteCallback
   * @param {String} status - the status of the delete action
   * @param {String} error - any error that occurred
   */

  /**
   * @summary Determines if this adapter supports the specific entity
   *
   * @function hasEntity
   * @param {String} entityType - the entity type to check for
   * @param {String/Array} entityId - the specific entity we are looking for
   *
   * @param {Callback} callback - An array of whether the adapter can has the
   *                              desired capability or an error
   */
  hasEntity(entityType, entityId, callback) {
    const origin = `${this.id}-adapter-hasEntity`;
    log.trace(origin);

    // Make the call -
    // verifyCapability(entityType, actionType, entityId, callback)
    return this.verifyCapability(entityType, null, entityId, callback);
  }

  /**
   * @summary Provides a way for the adapter to tell north bound integrations
   * whether the adapter supports type, action and specific entity
   *
   * @function verifyCapability
   * @param {String} entityType - the entity type to check for
   * @param {String} actionType - the action type to check for
   * @param {String/Array} entityId - the specific entity we are looking for
   *
   * @param {Callback} callback - An array of whether the adapter can has the
   *                              desired capability or an error
   */
  verifyCapability(entityType, actionType, entityId, callback) {
    const meth = 'adapterBase-verifyCapability';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    // if caching
    if (this.caching) {
      // Make the call - verifyCapability(entityType, actionType, entityId, callback)
      return this.requestHandlerInst.verifyCapability(entityType, actionType, entityId, (results, error) => {
        if (error) {
          return callback(null, error);
        }

        // if the cache needs to be updated, update and try again
        if (results && results[0] === 'needupdate') {
          switch (entityType) {
            case 'template_entity': {
              // if the cache is invalid, update the cache
              return this.getEntities(null, null, null, null, (data, err) => {
                if (err) {
                  const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Could not update entity: $VARIABLE$, cache', [entityType], null, null, null);
                  log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
                  return callback(null, errorObj);
                }

                // need to check the cache again since it has been updated
                return this.requestHandlerInst.verifyCapability(entityType, actionType, entityId, (vcapable, verror) => {
                  if (verror) {
                    return callback(null, verror);
                  }

                  return this.capabilityResults(vcapable, callback);
                });
              });
            }
            default: {
              // unsupported entity type
              const result = [false];

              // put false in array for all entities
              if (Array.isArray(entityId)) {
                for (let e = 1; e < entityId.length; e += 1) {
                  result.push(false);
                }
              }

              return callback(result);
            }
          }
        }

        // return the results
        return this.capabilityResults(results, callback);
      });
    }

    // if no entity id
    if (!entityId) {
      // need to check the cache again since it has been updated
      return this.requestHandlerInst.verifyCapability(entityType, actionType, null, (vcapable, verror) => {
        if (verror) {
          return callback(null, verror);
        }

        return this.capabilityResults(vcapable, callback);
      });
    }

    // if not caching
    switch (entityType) {
      case 'template_entity': {
        // need to get the entities to check
        return this.getEntities(null, null, null, null, (data, err) => {
          if (err) {
            const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Could not update entity: $VARIABLE$, cache', [entityType], null, null, null);
            log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
            return callback(null, errorObj);
          }

          // need to check the cache again since it has been updated
          return this.requestHandlerInst.verifyCapability(entityType, actionType, null, (vcapable, verror) => {
            if (verror) {
              return callback(null, verror);
            }

            // is the entity in the list?
            const isEntity = this.entityInList(entityId, data.response, callback);
            const res = [];

            // not found
            for (let i = 0; i < isEntity.length; i += 1) {
              if (vcapable) {
                res.push(isEntity[i]);
              } else {
                res.push(false);
              }
            }

            return callback(res);
          });
        });
      }
      default: {
        // unsupported entity type
        const result = [false];

        // put false in array for all entities
        if (Array.isArray(entityId)) {
          for (let e = 1; e < entityId.length; e += 1) {
            result.push(false);
          }
        }

        return callback(result);
      }
    }
  }

  /**
   * @summary Updates the cache for all entities by call the get All entity method
   *
   * @function updateEntityCache
   *
   */
  updateEntityCache() {
    const origin = `${this.id}-adapter-updateEntityCache`;
    log.trace(origin);

    if (this.caching) {
      // if the cache is invalid, update the cache
      this.getEntities(null, null, null, null, (data, err) => {
        if (err) {
          log.trace(`${origin}: Could not load template_entity into cache - ${err}`);
        }
      });
    }
  }

  /**
   * @summary function getLocalizations
   *
   * @function getLocalizations
   * @param {string} locale - Returns object of localized text
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getLocalizations(locale, callback) {
    const meth = 'adapter-getLocalizations';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Translation', 'getLocalizations', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getLocalizations'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getIncidents
   *
   * @function getIncidents
   * @param {string} startTime - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {string} service - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {string} instance - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {number} limit - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {number} offset - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {string} sort - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {string} order - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {string} locale - Returns an array of Incident objects. Defaults to last 30 days.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getIncidents(startTime, service, instance, limit, offset, sort, order, locale, callback) {
    const meth = 'adapter-getIncidents';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { startTime, service, instance, limit, offset, sort, order, locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Incidents', 'getIncidents', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getIncidents'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getIncidentsid
   *
   * @function getIncidentsid
   * @param {string} id - Returns an Incident based on Id.
   * @param {string} locale - Returns an Incident based on Id.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getIncidentsid(id, locale, callback) {
    const meth = 'adapter-getIncidentsid';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (id === undefined || id === null || id === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['id'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [id];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Incidents', 'getIncidentsid', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getIncidentsid'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getIncidentsfields
   *
   * @function getIncidentsfields
   * @param {string} locale - Returns an array of Incident fields.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getIncidentsfields(locale, callback) {
    const meth = 'adapter-getIncidentsfields';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Incidents', 'getIncidentsfields', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getIncidentsfields'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getIncidentsimpactTypes
   *
   * @function getIncidentsimpactTypes
   * @param {string} locale - Returns an array of incident imapct type fields.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getIncidentsimpactTypes(locale, callback) {
    const meth = 'adapter-getIncidentsimpactTypes';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Incidents', 'getIncidentsimpactTypes', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getIncidentsimpactTypes'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getIncidentseventTypes
   *
   * @function getIncidentseventTypes
   * @param {string} locale - Returns an array of incident imapct type fields.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getIncidentseventTypes(locale, callback) {
    const meth = 'adapter-getIncidentseventTypes';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Incidents', 'getIncidentseventTypes', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getIncidentseventTypes'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getMaintenances
   *
   * @function getMaintenances
   * @param {string} startTime - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {string} service - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {string} instance - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {string} name - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {number} limit - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {number} offset - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {string} sort - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {string} order - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {string} locale - Returns an array of Maintenance objects. Defaults to last 30 days.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getMaintenances(startTime, service, instance, name, limit, offset, sort, order, locale, callback) {
    const meth = 'adapter-getMaintenances';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { startTime, service, instance, name, limit, offset, sort, order, locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Maintenances', 'getMaintenances', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getMaintenances'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getMaintenancesid
   *
   * @function getMaintenancesid
   * @param {string} id - Returns a Maintenance based on Id.
   * @param {string} locale - Returns a Maintenance based on Id.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getMaintenancesid(id, locale, callback) {
    const meth = 'adapter-getMaintenancesid';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (id === undefined || id === null || id === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['id'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [id];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Maintenances', 'getMaintenancesid', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getMaintenancesid'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getMaintenancesfields
   *
   * @function getMaintenancesfields
   * @param {string} locale - Returns an array of Maintenance fields.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getMaintenancesfields(locale, callback) {
    const meth = 'adapter-getMaintenancesfields';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Maintenances', 'getMaintenancesfields', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getMaintenancesfields'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getMaintenanceseventTypes
   *
   * @function getMaintenanceseventTypes
   * @param {string} locale - Returns an array of maintenance imapct type fields.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getMaintenanceseventTypes(locale, callback) {
    const meth = 'adapter-getMaintenanceseventTypes';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Maintenances', 'getMaintenanceseventTypes', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getMaintenanceseventTypes'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getGeneralMessages
   *
   * @function getGeneralMessages
   * @param {number} limit - Returns an array of GeneralMessage objects.
   * @param {number} offset - Returns an array of GeneralMessage objects.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getGeneralMessages(limit, offset, callback) {
    const meth = 'adapter-getGeneralMessages';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { limit, offset };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('GeneralMessage', 'getGeneralMessages', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getGeneralMessages'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getGeneralMessagesid
   *
   * @function getGeneralMessagesid
   * @param {string} id - Returns a GeneralMessage based on Id.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getGeneralMessagesid(id, callback) {
    const meth = 'adapter-getGeneralMessagesid';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (id === undefined || id === null || id === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['id'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [id];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('GeneralMessage', 'getGeneralMessagesid', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getGeneralMessagesid'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getMetricValues
   *
   * @function getMetricValues
   * @param {string} startTime - Returns an array of MetricValue objects.
   * @param {string} endTime - Returns an array of MetricValue objects.
   * @param {string} metricName - Returns an array of MetricValue objects.
   * @param {string} instanceKey - Returns an array of MetricValue objects.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getMetricValues(startTime, endTime, metricName, instanceKey, callback) {
    const meth = 'adapter-getMetricValues';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { startTime, endTime, metricName, instanceKey };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('MetricValue', 'getMetricValues', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getMetricValues'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getMetricValuesid
   *
   * @function getMetricValuesid
   * @param {string} id - Returns a MetricValue based on Id.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getMetricValuesid(id, callback) {
    const meth = 'adapter-getMetricValuesid';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (id === undefined || id === null || id === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['id'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [id];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('MetricValue', 'getMetricValuesid', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getMetricValuesid'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getLocales
   *
   * @function getLocales
   * @param {string} locale - Return all locales
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getLocales(locale, callback) {
    const meth = 'adapter-getLocales';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Locales', 'getLocales', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getLocales'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getServices
   *
   * @function getServices
   * @param {string} locale - Return all locales
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getServices(locale, callback) {
    const meth = 'adapter-getServices';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Services', 'getServices', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getServices'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getInstances
   *
   * @function getInstances
   * @param {string} sort - Return all locales
   * @param {string} order - Return all locales
   * @param {string} products - Return all locales
   * @param {array} tags - Return all locales
   * @param {boolean} childProducts - Return all locales
   * @param {string} locale - Return all locales
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getInstances(sort, order, products, tags, childProducts, locale, callback) {
    const meth = 'adapter-getInstances';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { sort, order, products, tags, childProducts, locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Instances', 'getInstances', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getInstances'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getInstancesstatus
   *
   * @function getInstancesstatus
   * @param {string} products - DEPRECATED WARNING ROUTE WILL BE REMOVED
Use /instance/status/preview for overall current status and
currently ongoing incidents, maintenances, and general messages.
Use /instances/{key}/status for current status and recent
history of incidents, maintenances, and general messages for
sepcific instance

Return all instances and associated incidents
   * @param {boolean} childProducts - DEPRECATED WARNING ROUTE WILL BE REMOVED
Use /instance/status/preview for overall current status and
currently ongoing incidents, maintenances, and general messages.
Use /instances/{key}/status for current status and recent
history of incidents, maintenances, and general messages for
sepcific instance

Return all instances and associated incidents
   * @param {string} locale - DEPRECATED WARNING ROUTE WILL BE REMOVED
Use /instance/status/preview for overall current status and
currently ongoing incidents, maintenances, and general messages.
Use /instances/{key}/status for current status and recent
history of incidents, maintenances, and general messages for
sepcific instance

Return all instances and associated incidents
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getInstancesstatus(products, childProducts, locale, callback) {
    const meth = 'adapter-getInstancesstatus';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { products, childProducts, locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Instances', 'getInstancesstatus', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getInstancesstatus'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getInstancesstatuspreview
   *
   * @function getInstancesstatuspreview
   * @param {string} products - Return all instances and associated incidents, maintenances, and general messages.
For each instance returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {boolean} childProducts - Return all instances and associated incidents, maintenances, and general messages.
For each instance returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {string} locale - Return all instances and associated incidents, maintenances, and general messages.
For each instance returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getInstancesstatuspreview(products, childProducts, locale, callback) {
    const meth = 'adapter-getInstancesstatuspreview';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { products, childProducts, locale };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Instances', 'getInstancesstatuspreview', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getInstancesstatuspreview'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getInstanceskeystatuspreview
   *
   * @function getInstanceskeystatuspreview
   * @param {string} key - Rerurn an instance with associated incidents, maintenances, and general messages.
For a given instance returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {string} productKey - Rerurn an instance with associated incidents, maintenances, and general messages.
For a given instance returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {boolean} childProducts - Rerurn an instance with associated incidents, maintenances, and general messages.
For a given instance returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {string} locale - Rerurn an instance with associated incidents, maintenances, and general messages.
For a given instance returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getInstanceskeystatuspreview(key, productKey, childProducts, locale, callback) {
    const meth = 'adapter-getInstanceskeystatuspreview';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (key === undefined || key === null || key === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['key'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { productKey, childProducts, locale };
    const queryParams = {};
    const pathVars = [key];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Instances', 'getInstanceskeystatuspreview', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getInstanceskeystatuspreview'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getInstanceskeystatus
   *
   * @function getInstanceskeystatus
   * @param {string} key - Return an by instance with associated incidents, maintenances, and general messages.
Returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums:
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {string} productKey - Return an by instance with associated incidents, maintenances, and general messages.
Returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums:
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {boolean} childProducts - Return an by instance with associated incidents, maintenances, and general messages.
Returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums:
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {string} locale - Return an by instance with associated incidents, maintenances, and general messages.
Returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums:
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getInstanceskeystatus(key, productKey, childProducts, locale, callback) {
    const meth = 'adapter-getInstanceskeystatus';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (key === undefined || key === null || key === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['key'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { productKey, childProducts, locale };
    const queryParams = {};
    const pathVars = [key];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Instances', 'getInstanceskeystatus', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getInstanceskeystatus'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getInstanceAliaseskeystatus
   *
   * @function getInstanceAliaseskeystatus
   * @param {string} key - Return an by instance with associated incidents, maintenances, and general messages.
Returns a state enum indicating the most
severe ongoing event, and if it effects a core service.

Status Enums:
* OK
* MAJOR_INCIDENT_CORE
* MINOR_INCIDENT_CORE
* MAINTENANCE_CORE
* MAJOR_INCIDENT_NONCORE
* MINOR_INCIDENT_NONCORE
* MAINTENANCE_NONCORE
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getInstanceAliaseskeystatus(key, callback) {
    const meth = 'adapter-getInstanceAliaseskeystatus';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (key === undefined || key === null || key === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['key'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [key];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Instances', 'getInstanceAliaseskeystatus', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getInstanceAliaseskeystatus'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getInstanceAliaseskey
   *
   * @function getInstanceAliaseskey
   * @param {string} key - Get Instance Alias
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getInstanceAliaseskey(key, callback) {
    const meth = 'adapter-getInstanceAliaseskey';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (key === undefined || key === null || key === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['key'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [key];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Instances', 'getInstanceAliaseskey', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getInstanceAliaseskey'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getProducts
   *
   * @function getProducts
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getProducts(callback) {
    const meth = 'adapter-getProducts';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = null;

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Products', 'getProducts', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getProducts'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getProductskey
   *
   * @function getProductskey
   * @param {string} key - Returns an product by id.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getProductskey(key, callback) {
    const meth = 'adapter-getProductskey';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (key === undefined || key === null || key === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['key'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [key];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Products', 'getProductskey', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getProductskey'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function postSubscribe
   *
   * @function postSubscribe
   * @param {string} XSendNotification - XSendNotification param
   * @param {object} body - body param
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  postSubscribe(XSendNotification, body, callback) {
    const meth = 'adapter-postSubscribe';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (body === undefined || body === null || body === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['body'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribe', 'postSubscribe', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['postSubscribe'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function patchUnsubscribe
   *
   * @function patchUnsubscribe
   * @param {object} body - body param
   * @param {string} token - token param
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  patchUnsubscribe(body, token, callback) {
    const meth = 'adapter-patchUnsubscribe';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribe', 'patchUnsubscribe', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['patchUnsubscribe'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function postUnsubscribe
   *
   * @function postUnsubscribe
   * @param {object} body - body param
   * @param {string} token - token param
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  postUnsubscribe(body, token, callback) {
    const meth = 'adapter-postUnsubscribe';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribe', 'postUnsubscribe', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['postUnsubscribe'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function postLogin
   *
   * @function postLogin
   * @param {string} XSendNotification - Requests to send a login link to the email address
   * @param {object} body - Requests to send a login link to the email address
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  postLogin(XSendNotification, body, callback) {
    const meth = 'adapter-postLogin';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (body === undefined || body === null || body === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['body'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribe', 'postLogin', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['postLogin'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getLogout
   *
   * @function getLogout
   * @param {string} token - Logout authenticated user.
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getLogout(token, callback) {
    const meth = 'adapter-getLogout';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (token === undefined || token === null || token === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['token'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribe', 'getLogout', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getLogout'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Retrieve Subscriber
   *
   * @function getSubscribers
   * @param {string} token - Returns subscriber and subscription using token
   * @param {boolean} normalize - Returns subscriber and subscription using token
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getSubscribers(token, normalize, callback) {
    const meth = 'adapter-getSubscribers';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (token === undefined || token === null || token === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['token'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token, normalize };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribers', 'getSubscribers', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getSubscribers'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Update Subscriber
   *
   * @function patchSubscribers
   * @param {string} XSendNotification - Update subscriber using token
   * @param {string} token - Update subscriber using token
   * @param {object} body - Update subscriber using token
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  patchSubscribers(XSendNotification, token, body, callback) {
    const meth = 'adapter-patchSubscribers';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (token === undefined || token === null || token === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['token'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    if (body === undefined || body === null || body === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['body'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token };
    const queryParams = {};
    const pathVars = [];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribers', 'patchSubscribers', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['patchSubscribers'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Creates a Subscription for the User.
   *
   * @function postSubscriberssubscriptionsid
   * @param {string} id - id param
   * @param {string} token - token param
   * @param {object} body - body param
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  postSubscriberssubscriptionsid(id, token, body, callback) {
    const meth = 'adapter-postSubscriberssubscriptionsid';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (id === undefined || id === null || id === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['id'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    if (token === undefined || token === null || token === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['token'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    if (body === undefined || body === null || body === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['body'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token };
    const queryParams = {};
    const pathVars = [id];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribers', 'postSubscriberssubscriptionsid', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['postSubscriberssubscriptionsid'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Updates a Subscription for the User.
   *
   * @function patchSubscriberssubscriptionsid
   * @param {string} id - id param
   * @param {string} token - token param
   * @param {object} body - body param
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  patchSubscriberssubscriptionsid(id, token, body, callback) {
    const meth = 'adapter-patchSubscriberssubscriptionsid';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (id === undefined || id === null || id === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['id'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    if (token === undefined || token === null || token === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['token'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    if (body === undefined || body === null || body === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['body'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token };
    const queryParams = {};
    const pathVars = [id];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribers', 'patchSubscriberssubscriptionsid', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['patchSubscriberssubscriptionsid'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary Deletes a Subscription for the User.
   *
   * @function deleteSubscriberssubscriptionsid
   * @param {string} id - id param
   * @param {string} token - token param
   * @param {object} body - body param
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  deleteSubscriberssubscriptionsid(id, token, body, callback) {
    const meth = 'adapter-deleteSubscriberssubscriptionsid';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (id === undefined || id === null || id === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['id'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    if (token === undefined || token === null || token === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['token'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
    if (body === undefined || body === null || body === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['body'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { token };
    const queryParams = {};
    const pathVars = [id];
    const bodyVars = body;

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Subscribers', 'deleteSubscriberssubscriptionsid', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['deleteSubscriberssubscriptionsid'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getSearchkey
   *
   * @function getSearchkey
   * @param {string} key - Return all search results
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getSearchkey(key, callback) {
    const meth = 'adapter-getSearchkey';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (key === undefined || key === null || key === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['key'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = {};
    const queryParams = {};
    const pathVars = [key];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Search', 'getSearchkey', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getSearchkey'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getTags
   *
   * @function getTags
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getTags(callback) {
    const meth = 'adapter-getTags';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = null;

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Tags', 'getTags', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getTags'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getTagsinstanceinstanceKey
   *
   * @function getTagsinstanceinstanceKey
   * @param {string} instanceKey - Return all the tags for a given Instance Key
   * @param {boolean} instances - Return all the tags for a given Instance Key
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getTagsinstanceinstanceKey(instanceKey, instances, callback) {
    const meth = 'adapter-getTagsinstanceinstanceKey';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */
    if (instanceKey === undefined || instanceKey === null || instanceKey === '') {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Missing Data', ['instanceKey'], null, null, null);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    const queryParamsAvailable = { instances };
    const queryParams = {};
    const pathVars = [instanceKey];
    const bodyVars = {};

    // loop in template. long callback arg name to avoid identifier conflicts
    Object.keys(queryParamsAvailable).forEach((thisKeyInQueryParamsAvailable) => {
      if (queryParamsAvailable[thisKeyInQueryParamsAvailable] !== undefined && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== null
          && queryParamsAvailable[thisKeyInQueryParamsAvailable] !== '') {
        queryParams[thisKeyInQueryParamsAvailable] = queryParamsAvailable[thisKeyInQueryParamsAvailable];
      }
    });

    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = {
      payload: bodyVars,
      uriPathVars: pathVars,
      uriQuery: queryParams
    };

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Tags', 'getTagsinstanceinstanceKey', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getTagsinstanceinstanceKey'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }

  /**
   * @summary function getTagTypes
   *
   * @function getTagTypes
   * @param {getCallback} callback - a callback function to return the result
   */
  /* YOU CAN CHANGE THE PARAMETERS YOU TAKE IN HERE AND IN THE pronghorn.json FILE */
  getTagTypes(callback) {
    const meth = 'adapter-getTagTypes';
    const origin = `${this.id}-${meth}`;
    log.trace(origin);

    /* HERE IS WHERE YOU VALIDATE DATA */

    /* HERE IS WHERE YOU SET THE DATA TO PASS INTO REQUEST */
    // set up the request object - payload, uriPathVars, uriQuery, uriOptions, addlHeaders
    const reqObj = null;

    try {
      // Make the call -
      // identifyRequest(entity, action, requestObj, returnDataFlag, callback)
      return this.requestHandlerInst.identifyRequest('Tags', 'getTagTypes', reqObj, true, (irReturnData, irReturnError) => {
        // if we received an error or their is no response on the results
        // return an error
        if (irReturnError) {
          /* HERE IS WHERE YOU CAN ALTER THE ERROR MESSAGE */
          return callback(null, irReturnError);
        }
        if (!Object.hasOwnProperty.call(irReturnData, 'response')) {
          const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Invalid Response', ['getTagTypes'], null, null, null);
          log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
          return callback(null, errorObj);
        }

        /* HERE IS WHERE YOU CAN ALTER THE RETURN DATA */
        // return the response
        return callback(irReturnData, null);
      });
    } catch (ex) {
      const errorObj = this.requestHandlerInst.formatErrorObject(this.id, meth, 'Caught Exception', null, null, null, ex);
      log.error(`${origin}: ${errorObj.IAPerror.displayString}`);
      return callback(null, errorObj);
    }
  }
}

module.exports = Salesforce;
