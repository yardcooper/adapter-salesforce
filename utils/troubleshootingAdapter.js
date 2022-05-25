/* @copyright Itential, LLC 2020 */
/* eslint global-require: warn */
/* eslint no-console: warn */
/* eslint import/no-unresolved: warn */
/* eslint import/no-dynamic-require: warn */

const path = require('path');
const rls = require('readline-sync');
const fs = require('fs-extra');

const utils = require(path.join(__dirname, 'tbUtils'));
const basicGet = require(path.join(__dirname, 'basicGet'));
const { name } = require(path.join(__dirname, '..', 'package.json'));
const sampleProperties = require(path.join(__dirname, '..', 'sampleProperties.json'));

// send interactive questions and collection answers
// return updated connection object
const collectAnswersSync = (questions, props) => {
  const answers = [];
  questions.forEach((q) => {
    const answer = rls.question(q);
    answers.push(answer);
  });
  return utils.getNewProps(answers, props);
};

// change object into array of questions
const confirm = (props) => {
  const questions = Object.keys(props).map((key) => `${key}: (${props[key]}) `);
  return collectAnswersSync(questions, props);
};

// allow user to change auth_method
const confirmAuthOptions = (authentication) => {
  const authOptions = ['basic user_password', 'request_token', 'static_token', 'no_authentication'];
  const displayAuthOptions = utils.getDisplayAuthOptions(authentication.auth_method, authOptions);
  const index = rls.keyInSelect(displayAuthOptions, 'Which authentication?');
  if (index === -1) {
    return authentication.auth_method;
  }
  console.log(`${authOptions[index]} is selected.`);
  return authOptions[index];
};

// helper function to update auth properties
const confirmAndUpdate = (auth, config) => {
  const newAuth = confirm(auth);
  return utils.updateAuth(newAuth, auth, config);
};

// extract basic auth properties
const updateBasicAuth = (config, authentication) => {
  const auth = {
    username: authentication.username,
    password: authentication.password
  };
  return confirmAndUpdate(auth, config);
};

// extract static auth properties
const updateStaticAuth = (config, authentication) => {
  const auth = {
    token: authentication.token,
    auth_field: authentication.auth_field,
    auth_field_format: authentication.auth_field_format
  };
  return confirmAndUpdate(auth, config);
};

// troubleshooting connection and healthcheck endpoint setting of adapter
const VerifyHealthCheckEndpoint = (serviceItem, props, scriptFlag) => {
  // Updates connectivity params and runs connectivity
  let connConfig;
  const result = {};
  if (scriptFlag) {
    const connection = utils.getConnection(serviceItem.properties);
    const newConnection = confirm(connection);
    utils.runConnectivity(newConnection.host, scriptFlag);
    connConfig = utils.updateNewConnection(serviceItem, newConnection);
  } else {
    let { properties: { properties: { host } } } = serviceItem;
    if (props.connProps) {
      connConfig = utils.updateNewConnection(serviceItem, props.connProps);
      host = connConfig.properties.properties.host;
    } else {
      connConfig = serviceItem;
    }
    result.connectivity = utils.runConnectivity(host, scriptFlag);
  }
  // Updates the healthcheck endpoing
  const healthcheck = require('../entities/.system/action.json');
  const healthCheckEndpoint = utils.getHealthCheckEndpoint(healthcheck);
  let newHealthCheckEndpoint = healthCheckEndpoint;
  if (scriptFlag) {
    newHealthCheckEndpoint = confirm(healthCheckEndpoint);
    utils.getHealthCheckEndpointURL(newHealthCheckEndpoint, connConfig);
  } else if (props.healthCheckEndpoint) {
    newHealthCheckEndpoint = props.healthCheckEndpoint;
  }
  // Updates the authorization params
  const { authentication } = connConfig.properties.properties;
  let updatedAdapter = connConfig;
  if (scriptFlag) {
    authentication.auth_method = confirmAuthOptions(authentication);
    if (authentication.auth_method === 'basic user_password') {
      updatedAdapter = updateBasicAuth(connConfig, authentication);
    } else if (authentication.auth_method === 'static_token') {
      updatedAdapter = updateStaticAuth(connConfig, authentication);
    } else if (authentication.auth_method === 'request_token') {
      console.log('current troubleshooting script does not support updating request_token authentication');
    }
  } else if (props.auth) {
    updatedAdapter = utils.updateAuth(props.auth, authentication, connConfig);
  }
  // Writes the new healthcheck endpoint into action.json
  utils.updateHealthCheckEndpoint(newHealthCheckEndpoint, healthCheckEndpoint, healthcheck);
  return { result, updatedAdapter };
};

const offline = async () => {
  console.log('Start offline troubleshooting');
  const { updatedAdapter } = VerifyHealthCheckEndpoint({ properties: sampleProperties }, {}, true);
  const a = basicGet.getAdapterInstance(updatedAdapter);
  const res = await utils.healthCheck(a);
  if (!res) {
    console.log('run `npm run troubleshoot` again to update settings');
    process.exit(0);
  }
  console.log('Save changes to sampleProperties.json');
  await fs.writeFile('sampleProperties.json', JSON.stringify(updatedAdapter.properties, null, 2));
  if (rls.keyInYN('Test with more GET request')) {
    await utils.runBasicGet(true);
  }
};

const troubleshoot = async (props, scriptFlag, persistFlag, adapter) => {
  // get database connection and existing adapter config
  const { database, serviceItem } = await utils.getAdapterConfig();
  // where troubleshoot should start
  if (serviceItem) {
    if (!scriptFlag || rls.keyInYN(`Start verifying the connection and authentication properties for ${name}?`)) {
      const { result, updatedAdapter } = VerifyHealthCheckEndpoint(serviceItem, props, scriptFlag);
      let a;
      if (scriptFlag) {
        a = basicGet.getAdapterInstance(updatedAdapter);
      } else {
        a = adapter;
      }
      const healthRes = await utils.healthCheck(a);
      result.healthCheck = healthRes;
      if (scriptFlag && !healthRes) {
        console.log('run `npm run troubleshoot` again to update settings');
        process.exit(0);
      }

      if (persistFlag && healthRes) {
        const update = { $set: { properties: updatedAdapter.properties } };
        await database.collection(utils.SERVICE_CONFIGS_COLLECTION).updateOne(
          { model: name }, update
        );
        if (scriptFlag) {
          console.log(`${name} updated.`);
        }
      }
      if (scriptFlag) {
        if (rls.keyInYN('Test with more GET request')) {
          await utils.runBasicGet(scriptFlag);
          process.exit(0);
        } else {
          console.log('Exiting');
          process.exit(0);
        }
      } else {
        result.basicGet = await utils.runBasicGet(scriptFlag);
        return result;
      }
    } else {
      console.log('You can update healthCheckEndpoint in ./entities/.system/action.json');
      console.log('You can update authentication credientials under Settings/Services');
      console.log('Exiting');
      process.exit(0);
    }
  } else {
    console.log(`${name} not installed`);
    console.log('run `npm run install:adapter` to install current adapter to IAP first. Exiting...');
  }
  return null;
};

module.exports = { troubleshoot, offline };
