/* @copyright Itential, LLC 2020 */

/* eslint import/no-extraneous-dependencies: warn */
/* eslint global-require: warn */
/* eslint import/no-dynamic-require: warn */

const path = require('path');
const fs = require('fs-extra');
const cp = require('child_process');

module.exports = {
  SERVICE_CONFIGS_COLLECTION: 'service_configs',
  IAP_PROFILES_COLLECTION: 'iap_profiles',

  /**
   * @summary update newConnection properties in adapter config
   *
   * @function updateNewConnection
   * @param {Object} config - adaper configuration object required by IAP
   * @param {Object} newConnection - connection related property collection from user
   */
  updateNewConnection: (config, newConnection) => {
    const updatedConfig = JSON.parse(JSON.stringify(config));
    Object.keys(newConnection).forEach((key) => {
      updatedConfig.properties.properties[key] = newConnection[key];
    });
    return updatedConfig;
  },

  /**
   * @summary assemble heathcheck endpoint into an URL
   *
   * @function getHealthCheckEndpointURL
   * @param {Object} endpoint - user updated healthcheck endpoint object
   * @param {Object} config - adaper configuration object required by IAP
   */
  getHealthCheckEndpointURL: (endpoint, config) => {
    const p = config.properties.properties;
    const healthCheckEndpointURL = `${p.protocol}://${p.host}${p.base_path}${p.version}${endpoint.healthCheckEndpoint}`;
    console.log({ healthCheckEndpointURL });
    return healthCheckEndpointURL;
  },

  /**
   * @summary persist healthcheck endpoint when user make update
   *
   * @function updateHealthCheckEndpoint
   * @param {Object} newHealthCheckEndpoint - user confirmed healthcheck object
   * @param {Object} healthCheckEndpoint - existing healthcheck object
   * @param {Object} healthcheck - ./entities/.system/action.json object
   */
  updateHealthCheckEndpoint: (newHealthCheckEndpoint, healthCheckEndpoint, healthcheck) => {
    if (newHealthCheckEndpoint.healthCheckEndpoint !== healthCheckEndpoint.healthCheckEndpoint) {
      const p = healthcheck.actions[1].entitypath;
      const newEntitypath = p.slice(0, 21) + newHealthCheckEndpoint.healthCheckEndpoint + p.slice(p.length - 8);
      const updatedHealthcheck = JSON.parse(JSON.stringify(healthcheck));
      updatedHealthcheck.actions[1].entitypath = newEntitypath;
      console.log('updating healthcheck setting');
      fs.writeFileSync('./entities/.system/action.json', JSON.stringify(updatedHealthcheck, null, 2));
    }
  },

  /**
   * @summary update authentication property given new input value from user
   *          compare values from auth and newAuth, if there's difference
   *          update adapter config
   * @function updateAuth
   * @param {Object} newAuth - user confirmed authentication object
   * @param {Object} auth - existing authentication object
   * @param {Object} config - adaper configuration object required by IAP
   */
  updateAuth: (newAuth, auth, config) => {
    const updatedConfig = JSON.parse(JSON.stringify(config));
    if (Object.keys(newAuth).every((key) => newAuth[key] === auth[key])) {
      return config;
    }
    Object.keys(newAuth).forEach((key) => {
      updatedConfig.properties.properties.authentication[key] = newAuth[key];
    });
    console.log(updatedConfig.properties.properties.authentication);
    return updatedConfig;
  },

  /**
   * @summary add mark current auth_method with `(current)`
   *
   * @function getDisplayAuthOptions
   * @param {String} currentAuth - current auth method in adapter config
   * @param {Array} authOptions - available auth method
   */
  getDisplayAuthOptions: (currentAuth, authOptions) => {
    const displayAuthOptions = JSON.parse(JSON.stringify(authOptions));
    displayAuthOptions[authOptions.indexOf(currentAuth)] += ' (current)';
    return displayAuthOptions;
  },

  /**
   * @summary decrypt IAP properties
   *          code from pronghorn-core/migration_scripts/installService.js
   *
   * @function decryptProperties
   */
  decryptProperties: (props, dirname, discovery) => {
    const propertyEncryptionClassPath = path.join(dirname, '../../../@itential/pronghorn-core/core/PropertyEncryption.js');
    const isEncrypted = props.pathProps.encrypted;
    const PropertyEncryption = discovery.require(propertyEncryptionClassPath, isEncrypted);
    const propertyEncryption = new PropertyEncryption({
      algorithm: 'aes-256-ctr',
      key: 'TG9uZ0Rpc3RhbmNlUnVubmVyUHJvbmdob3JuCg==',
      encoding: 'utf-8'
    });
    return propertyEncryption.decryptProps(props);
  },

  /**
   * @summary create connection object for verification
   *
   * @function getConnection
   * @param {Object} props - adapter config.properties
   */
  getConnection: (props) => {
    const connection = {
      host: props.properties.host,
      base_path: props.properties.base_path,
      protocol: props.properties.protocol,
      version: props.properties.version,
      port: props.properties.port
    };
    return connection;
  },

  /**
   * @summary update connection properties based on user answer
   *
   * @function getNewProps
   * @param {Array} answers - values collected from CLI
   * @param {Object} connection - connection property verified by user
   */
  getNewProps: (answers, connection) => {
    if (answers.every((answer) => answer === '')) {
      return connection;
    }
    const newConnection = {};
    const properties = Object.keys(connection);
    for (let i = 0; i < answers.length; i += 1) {
      if (answers[i]) {
        newConnection[properties[i]] = Number.isNaN(Number(answers[i])) ? answers[i] : Number(answers[i]);
      } else {
        newConnection[properties[i]] = connection[properties[i]];
      }
    }
    return newConnection;
  },

  /**
   * @summary extract endpoint string from healthcheck object
   *
   * @function getHealthCheckEndpoint
   * @param {Object} healthcheck - {Object} healthcheck - ./entities/.system/action.json object
   */
  getHealthCheckEndpoint: (healthcheck) => {
    const endpoint = healthcheck.actions[1].entitypath.slice(21,
      healthcheck.actions[1].entitypath.length - 8);
    return { healthCheckEndpoint: endpoint };
  },

  /**
   * @summary Verify that the adapter is in the correct directory
   *          - Within IAP
   *          - In node_modules/@ namespace
   *          verify the adapter is installed under node_modules/
   *          and is consistent with the name property of package.json
   *          and the node_modules/ is in the correct path within IAP
   * @param {String} dirname - current path
   * @param {String} name - name property from package.json
   */
  verifyInstallationDir: (dirname, name) => {
    const pathArray = dirname.split(path.sep);
    const expectedPath = `node_modules/${name}`;
    const currentPath = pathArray.slice(pathArray.length - 4, pathArray.length - 1).join('/');
    if (expectedPath !== currentPath) {
      throw new Error(`adapter should be installed under ${expectedPath}`);
    }

    const serverFile = path.join(dirname, '../../../..', 'server.js');
    if (!fs.existsSync(serverFile)) {
      throw new Error(`adapter should be installed under IAP/${expectedPath}`);
    }
    console.log(`adapter correctly installed at ${currentPath}`);
  },

  /**
   * @summary execute command and preserve the output the same as run command in shell
   *
   * @function systemSync
   * @param {String} cmd - Command to execute
   * @param {boolean} process - Whether stdout should be processed and returned
   */
  systemSync: function systemSync(cmd, process) {
    if (process) {
      let stdout;
      try {
        stdout = cp.execSync(cmd).toString();
      } catch (error) {
        stdout = error.stdout.toString();
      }
      const output = this.getTestCount(stdout);
      output.stdout = stdout;
      return output;
    }
    try {
      return cp.execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      return console.error(error.stdout);
    }
  },

  /**
   * @summary parses a string and returns the number parsed from startIndex backwards
   *
   * @function parseNum
   * @param {String} inputStr - Any String
   * @param {Number} startIndex - Index to begin parsing
   */
  parseNum: function parseNum(inputStr, startIndex) {
    let count = '';
    let currChar;
    let start = startIndex;
    while (currChar !== ' ') {
      currChar = inputStr.charAt(start);
      count = currChar + count;
      start -= 1;
    }
    return parseInt(count, 10);
  },

  /**
   * @summary Parses a mocha test result and returns the count of passing and failing tests
   *
   * @function getTestCount
   * @param {String} testStr - Output from mocha test
   */
  getTestCount: function getTestCount(testStr) {
    const passIndex = testStr.search('passing');
    const failIndex = testStr.search('failing');
    const passCount = passIndex >= 0 ? this.parseNum(testStr, passIndex - 2) : 0;
    const failCount = failIndex >= 0 ? this.parseNum(testStr, failIndex - 2) : 0;
    return { passCount, failCount };
  },

  /**
   * @summary remove package-lock.json and node_modules directory if exists
   * run npm install and print result to stdout
   */
  npmInstall: function npmInstall() {
    fs.removeSync('../package-lock.json');
    fs.removeSync('../node_modules/');
    console.log('Run npm install ...');
    this.systemSync('npm install');
  },

  /**
   * @summary run lint, unit test and integration test
   * print result to stdout
   */
  runTest: function runTest() {
    this.systemSync('npm run lint:errors');
    this.systemSync('npm run test:unit');
    this.systemSync('npm run test:integration');
  },

  /**
   * @summary run basicget with mocha
   * @param {boolean} scriptFlag - whether the function is ran from a script
   * print result to stdout
   * returns mocha test results otherwise
   */
  runBasicGet: function runBasicGet(scriptFlag) {
    const testPath = path.resolve(__dirname, '..', 'test/integration/adapterTestBasicGet.js');
    return this.systemSync(`mocha ${testPath} --exit`, !scriptFlag);
  },

  /**
   * @summary run connectivity with mocha
   * @param {String} host - Host url to run healthcheck
   * @param {boolean} scriptFlag - Whether the function is ran from a script
   * print result to stdout if ran from script
   * returns mocha test results otherwise
   */
  runConnectivity: function runConnectivity(host, scriptFlag) {
    let testPath = 'test/integration/adapterTestConnectivity.js';
    if (!scriptFlag) {
      testPath = path.resolve(__dirname, '..', testPath);
    }
    return this.systemSync(`mocha ${testPath} --HOST=${host} --timeout 10000 --exit`, !scriptFlag);
  },

  /**
   * @summary create Adapter property
   *
   * @function createAdapter
   * @param {Object} pronghornProps - decrypted 'properties.json' from IAP root directory
   * @param {Object} profileItem - pronghorn props saved in database
   * @param {Object} adapterPronghorn - ./pronghorn.json in adapter dir
   * @param {Object} sampleProperties - './sampleProperties.json' in adapter dir
   */
  createAdapter: (pronghornProps, profileItem, sampleProperties, adapterPronghorn) => {
    const adapter = {
      mongoProps: pronghornProps.mongoProps,
      isEncrypted: pronghornProps.pathProps.encrypted,
      model: adapterPronghorn.id,
      name: sampleProperties.id,
      type: adapterPronghorn.type,
      properties: sampleProperties,
      redisProps: profileItem.redisProps,
      loggerProps: profileItem.loggerProps,
      rabbitmq: profileItem.rabbitmq
    };
    adapter.loggerProps.log_filename = `adapter-${adapter.name}.log`;
    adapter.mongoProps.pdb = true;
    return adapter;
  },

  /**
   * @summary return async healthcheck result as a Promise
   *
   * @function request
   * @param {Adapter} a - Adapter instance
   */
  request: function request(a) {
    return new Promise((resolve, reject) => {
      a.healthCheck(null, (data) => {
        if (!data) reject(new Error('healthCheckEndpoint failed'));
        resolve(data);
      });
    });
  },

  /**
   * @summary deal with healthcheck response returned from adapter instace
   *
   * @function healthCheck
   * @param {Adapter} a - Adapter instance
   */
  healthCheck: async function healthCheck(a) {
    const result = await this.request(a)
      .then((res) => {
        console.log('healthCheckEndpoint OK');
        return res;
      })
      .catch((error) => {
        console.error(error.message);
        return false;
      });
    return result;
  },

  /**
   * @summary Check whether adapter is located within IAP node_modules
   *          by loading properties.json. If not, return false.
   * @function withinIAP
   * @param {String} iapDir root directory of IAP
   */
  withinIAP: (iapDir) => {
    try {
      const rawProps = require(path.join(iapDir, 'properties.json'));
      return rawProps;
    } catch (error) {
      return false;
    }
  }
};
