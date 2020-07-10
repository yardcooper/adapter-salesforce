# Salesforce Adapter

This adapter is used to integrate the Itential Automation Platform (IAP) with the Salesforce System. The API for Salesforce is available at [undefined API URL]. The adapter utilizes the Salesforce API to provide the integrations that are deemed pertinent to IAP. This ReadMe file is intended to provide information on this adapter.

>**Note**: It is possible that some integrations will be supported through the Salesforce adapter while other integrations will not.

Itential provides information on all of its product adapters in the Customer Knowledge Base. Information in the [Customer Knowledge Base](https://itential.atlassian.net/servicedesk/customer/portals) is consistently maintained and goes through documentation reviews. As a result, it should be the first place to go for information.

For custom built adapters, it is a starting point to understand what you have built, provide the information for you to be able to update the adapter, and assist you with deploying the adapter into IAP.

## Versioning

Itential Product adapters utilize SemVer for versioning. The current version of the adapter can be found in the `package.json` file or viewed in the IAP GUI on the System page. For Open Source Adapters, the versions available can be found in the [Itential OpenSource Repository](https://www.npmjs.com/search?q=itentialopensource%2Fadapter).

## Release History

Any release prior to 1.0.0 is a pre-release. Initial builds of adapters are generally set up as pre-releases as there is often work that needs to be done to configure the adapter and make sure the authentication process to Salesforce works appropriately.

Release notes can be viewed in CHANGELOG.md or in the [Customer Knowledge Base](https://itential.atlassian.net/servicedesk/customer/portals) for Itential adapters.

## Getting Started

These instructions will help you get a copy of the project on your local machine for development and testing. Reading this section is also helpful for deployments as it provides you with pertinent information on prerequisites and properties.

### Adapter Technical Resources

There is adapter documentation available on the Itential Developer Site [HERE](https://developer.itential.io/adapters-resources/). This documentation includes information and examples that are helpful for:

```text
Authentication
Properties
Code Files
Action Files
Schema Files
Mock Data Files
Linting and Testing
Troubleshooting
```

Others will be added over time.
Want to build a new adapter? Use the Adapter Builder [HERE](https://adapters.itential.io)

### Environment Prerequisites

The following is a list of required packages for an adapter.

```text
Node.js
npm
Git
```

### Adapter Prerequisites

The following list of packages are required for Itential product adapters or custom adapters that have been built utilizing the Itential Adapter Builder.

| Package | Description |
| ------- | ------- |
| @itentialopensource/adapter-utils | Runtime library classes for all adapters;  includes request handling, connection, throttling, and translation. |
| ajv | Required for validation of adapter properties to integrate with Salesforce. |
| fs-extra | Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality. |
| readline-sync | Utilized by the testRunner script that comes with the adapter;  helps to test unit and integration functionality. |

### Additional Prerequisites for Development and Testing

If you are developing and testing a custom adapter, or have testing capabilities on an Itential product adapter, you will need to install these packages as well.

```text
chai
eslint
eslint-config-airbnb-base
eslint-plugin-import
eslint-plugin-json
mocha
nyc
testdouble
winston
```

### Creating a Workspace

The following provides a local copy of the repository along with adapter dependencies.

```bash
git clone git@gitlab.com:\@itentialopensource/adapters/adapter-salesforce
npm install
```

## Adapter Properties and Descriptions

This section defines **all** the properties that are available for the adapter, including detailed information on what each property is for. If you are not using certain capabilities with this adapter, you do not need to define all of the properties. An example of how the properties for this adapter can be used with tests or IAP are provided in the **Installation** section.

```json
  {
    "id": "ALL ADAPTER PROPERTIES!!!",
    "properties": {
      "host": "system.access.resolved",
      "port": 443,
      "base_path": "/",
      "version": "v1",
      "cache_location": "local",
      "encode_pathvars": true,
      "save_metric": true,
      "stub": false,
      "protocol": "https",
      "authentication": {
        "auth_method": "basic user_password",
        "username": "username",
        "password": "password",
        "token": "token",
        "invalid_token_error": 401,
        "token_timeout": 0,
        "token_cache": "local",
        "auth_field": "header.headers.X-AUTH-TOKEN",
        "auth_field_format": "{token}"
      },
      "healthcheck": {
        "type": "startup",
        "frequency": 300000
      },
      "request": {
        "number_redirects": 0,
        "number_retries": 3,
        "limit_retry_error": [401],
        "failover_codes": [404, 405],
        "attempt_timeout": 5000,
        "global_request": {
          "payload": {},
          "uriOptions": {},
          "addlHeaders": {},
          "authData": {}
        },
        "healthcheck_on_timeout": false,
        "return_raw": false,
        "archiving": false
      },
      "ssl": {
        "ecdhCurve": "",
        "enabled": false,
        "accept_invalid_cert": false,
        "ca_file": "",
        "key_file": "",
        "cert_file": "",
        "secure_protocol": "",
        "ciphers": ""
      },
      "throttle": {
        "throttle_enabled": false,
        "number_pronghorns": 1,
        "sync_async": "sync",
        "max_in_queue": 1000,
        "concurrent_max": 1,
        "expire_timeout": 0,
        "avg_runtime": 200,
        "priorities": []
      },
      "proxy": {
        "enabled": false,
        "host": "localhost",
        "port": 9999,
        "protocol": "http"
      },
      "mongo": {
        "host": "",
        "port": 0,
        "database": "",
        "username": "",
        "password": "",
        "replSet": "",
        "db_ssl": {
          "enabled": false,
          "accept_invalid_cert": false,
          "ca_file": "",
          "key_file": "",
          "cert_file": ""
        }
      }
    },
    "type": "YOUR ADAPTER CLASS"
  }
```

### Connection Properties

These base properties are used to connect to Salesforce upon the adapter initially coming up. It is important to set these properties appropriately.

| Property | Description |
| ------- | ------- |
| host | Required. A fully qualified domain name or IP address.|
| port | Required. Used to connect to the server.|
| base_path | Optional. Used to define part of a path that is consistent for all or most endpoints. It makes the URIs easier to use and maintain but can be overridden on individual calls. An example **base_path** might be `/rest/api`. Default is ``.|
| version | Optional. Used to set a global version for action endpoints. This makes it faster to update the adapter when endpoints change. As with the base-path, version can be overridden on individual endpoints. Default is ``.|
| cache\_location | Optional. Used to define where the adapter cache is located. The cache is used to maintain an entity list to improve performance. Storage locally is lost when the adapter is restarted. Storage in Redis is preserved upon adapter restart. Default is none which means no caching of the entity list.|
| encode\_pathvars | Optional. Used to tell the adapter to encode path variables or not. The default behavior is to encode them so this property can b e used to stop that behavior.|
| save\_metric | Optional. Used to tell the adapter to save metric information (this does not impact metrics returned on calls). This allows the adapter to gather metrics over time. Metric data can be stored in a database or on the file system.|
| stub | Optional. Indicates whether the stub should run instead of making calls to Salesforce (very useful during basic testing). Default is false (which means connect to Salesforce).|
| protocol | Optional. Notifies the adapter whether to use HTTP or HTTPS. Default is HTTP.|

A connectivity check tells IAP the adapter has loaded successfully.

### Authentication Properties

The following properties are used to define the authentication process to Salesforce.

>**Note**: Depending on the method that is used to authenticate with Salesforce, you may not need to set all of the authentication properties.

| Property | Description |
| ------- | ------- |
| auth\_method | Required. Used to define the type of authentication currently supported. Authentication methods currently supported are: `basic user_password`, `static_token`, `request_token`, and `no_authentication`.|
| username | Used to authenticate with Salesforce on every request or when pulling a token that will be used in subsequent requests.|
| password | Used to authenticate with Salesforce on every request or when pulling a token that will be used in subsequent requests.|
| token | Defines a static token that can be used on all requests. Only used with `static_token` as an authentication method (auth\_method).|
| invalid\_token\_error | Defines the HTTP error that is received when the token is invalid. Notifies the adapter to pull a new token and retry the request. Default is 401.|
| token\_timeout | Defines how long a token is valid. Measured in milliseconds. Once a dynamic token is no longer valid, the adapter has to pull a new token. If the token\_timeout is set to -1, the adapter will pull a token on every request to Salesforce. If the timeout\_token is 0, the adapter will use the expiration from the token response to determine when the token is no longer valid.|
| token\_cache | Used to determine where the token should be stored (local memory or in Redis).|
| auth\_field | Defines the request field the authentication (e.g., token are basic auth credentials) needs to be placed in order for the calls to work.|
| auth\_field\_format | Defines the format of the auth\_field. See examples below. Items enclosed in {} inform the adapter to perofrm an action prior to sending the data. It may be to replace the item with a value or it may be to encode the item. |

#### Examples of authentication field format

```json
"{token}"
"Token {token}"
"{username}:{password}"
"Basic {b64}{username}:{password}{/b64}"
```

### Healthcheck Properties

The healthcheck properties defines the API that runs the healthcheck to tell the adapter that it can reach Salesforce. There are currently three types of healthchecks.

- None - Not recommended. Adapter will not run a healthcheck. Consequently, unable to determine before making a request if the adapter can reach Salesforce.
- Startup - Adapter will check for connectivity when the adapter initially comes up, but it will not check afterwards.
- Intermittent - Adapter will check connectivity to Salesforce at a frequency defined in the `frequency` property.

| Property | Description |
| ------- | ------- |
| type | Required. The type of health check to run. |
| frequency | Required if intermittent. Defines how often the health check should run. Measured in milliseconds. Default is 300000.|

### Request Properties

The request section defines properties to help handle requests.

| Property | Description |
| ------- | ------- |
| number\_redirects | Optional. Tells the adapter that the request may be redirected and gives it a maximum number of redirects to allow before returning an error. Default is 0 - no redirects.|
| number\_retries | Tells the adapter how many times to retry a request that has either aborted or reached a limit error before giving up and returning an error.|
| limit\_retry\_error | Optional. Can be either an integer or an array. Indicates the http error status number to define that no capacity was available and, after waiting a short interval, the adapter can retry the request. If an array is provvided, the array can contain integers or strings. Strings in the array are used to define ranges (e.g. "502-506"). Default is [0].|
| failover\_codes | An array of error codes for which the adapter will send back a failover flag to IAP so that the Platform can attempt the action in another adapter.|
| attempt\_timeout | Optional. Tells how long the adapter should wait before aborting the attempt. On abort, the adapter will do one of two things: 1) return the error; or 2) if **healthcheck\_on\_timeout** is set to true, it will abort the request and run a Healthcheck until it re-establishes connectivity to Salesforce, and then will re-attempt the request that aborted. Default is 5000 milliseconds.|
| global\_request | Optional. This is information that the adapter can include in all requests to the other system. This is easier to define and maintain than adding this information in either the code (adapter.js) or the action files.|
| global\_request -> payload | Optional. Defines any information that should be included on all requests sent to the other system that have a payload/body.|
| global\_request -> uriOptions | Optional. Defines any information that should be sent as untranslated  query options (e.g. page, size) on all requests to the other system.|
| global\_request -> addlHeaders | Optioonal. Defines any headers that should be sent on all requests to the other system.|
| global\_request -> authData | Optional. Defines any additional authentication data used to authentice with the other system. This authData needs to be consistent on every request.|
| healthcheck\_on\_timeout | Required. Defines if the adapter should run a health check on timeout. If set to true, the adapter will abort the request and run a health check until it re-establishes connectivity and then it will re-attempt the request.|
| return\_raw | Optional. Tells the adapter whether the raw response should be returned as well as the IAP response. This is helpful when running integration tests to save mock data. It does add overhead to the response object so it is not ideal from production.|
| archiving | Optional flag. Default is false. It archives the request, the results and the various times (wait time, Salesforce time and overall time) in the `adapterid_results` collection in MongoDB. Although archiving might be desirable, be sure to develop a strategy before enabling this capability. Consider how much to archive and what strategy to use for cleaning up the collection in the database so that it does not become too large, especially if the responses are large.|

### SSL Properties

The SSL section defines the properties utilized for ssl authentication with Salesforce. SSL can work two different ways: set the `accept\_invalid\_certs` flag to true (only recommended for lab environments), or provide a `ca\_file`.

| Property | Description |
| ------- | ------- |
| enabled | If SSL is required, set to true. |
| accept\_invalid\_certs | Defines if the adapter should accept invalid certificates (only recommended for lab environments). Required if SSL is enabled. Default is false.|
| ca\_file | Defines the path name to the CA file used for SSL. If SSL is enabled and the accept invalid certifications is false, then ca_file is required.|
| key\_file | Defines the path name to the Key file used for SSL. The key_file may be needed for some systems but it is not required for SSL.|
| cert\_file | Defines the path name to the Certificate file used for SSL. The cert_file may be needed for some systems but it is not required for SSL.|
| secure\_protocol | Defines the protocol (e.g., SSLv3_method) to use on the SSL request.|
| ciphers | Required if SSL enabled. Specifies a list of SSL ciphers to use.|
| ecdhCurve | During testing on some Node 8 environments, you need to set `ecdhCurve` to auto. If you do not, you will receive PROTO errors when attempting the calls. This is the only usage of this property and to our knowledge it only impacts Node 8 and 9. |

### Throttle Properties

The throttle section is used when requests to Salesforce must be queued (throttled). All of the properties in this section are optional.

| Property | Description |
| ------- | ------- |
| throttle\_enabled | Default is false. Defines if the adapter should use throttling o rnot. |
| number\_pronghorns | Default is 1. Defines if throttling is done in a single Itential instance or whether requests are being throttled across multiple Itential instances (minimum = 1, maximum = 20). Throttling in a single Itential instance uses an in-memory queue so there is less overhead. Throttling across multiple Itential instances requires placing the request and queue information into a shared resource (e.g. database) so that each instance can determine what is running and what is next to run. Throttling across multiple instances requires additional I/O overhead.|
| sync-async | This property is not used at the current time (it is for future expansion of the throttling engine).|
| max\_in\_queue | Represents the maximum number of requests the adapter should allow into the queue before rejecting requests (minimum = 1, maximum = 5000). This is not a limit on what the adapter can handle but more about timely responses to requests. The default is currently 1000.|
| concurrent\_max | Defines the number of requests the adapter can send to Salesforce at one time (minimum = 1, maximum = 1000). The default is 1 meaning each request must be sent to Salesforce in a serial manner. |
| expire\_timeout | Default is 0. Defines a graceful timeout of the request session. After a request has completed, the adapter will wait additional time prior to sending the next request. Measured in milliseconds (minimum = 0, maximum = 60000).|
| average\_runtime | Represents the approximate average of how long it takes Salesforce to handle each request. Measured in milliseconds (minimum = 50, maximum = 60000). Default is 200. This metric has performance implications. If the runtime number is set too low, it puts extra burden on the CPU and memory as the requests will continually try to run. If the runtime number is set too high, requests may wait longer than they need to before running. The number does not need to be exact but your throttling strategy depends heavily on this number being within reason. If averages range from 50 to 250 milliseconds you might pick an average run-time somewhere in the middle so that when Salesforce performance is exceptional you might run a little slower than you might like, but when it is poor you still run efficiently.|
| priorities | An array of priorities and how to handle them in relation to the throttle queue. Array of objects that include priority value and percent of queue to put the item ex { value: 1, percent: 10 }|

### Proxy Properties

The proxy section defines the properties to utilize when Salesforce is behind a proxy server.

| Property | Description |
| ------- | ------- |
| enabled | Required. Default is false. If Salesforce is behind a proxy server, set enabled flag to true. |
| host | Host information for the proxy server. Required if `enabled` is true.|
| port | Port information for the proxy server. Required if `enabled` is true.|
| protocol | The protocol (i.e., http, https, etc.) used to connect to the proxy. Default is http.|

### Mongo Properties

The mongo section defines the properties used to connect to a Mongo database. Mongo can be used for throttling as well as to persist metric data. If not provided, metrics will be stored in the file system.

| Property | Description |
| ------- | ------- |
| host | Optional. Host information for the mongo server.|
| port | Optional. Port information for the mongo server.|
| database | Optional. The database for the adapter to use for its data.|
| username | Optional. If credentials are required to access mongo, this is the user to login as.|
| password | Optional. If credentials are required to access mongo, this is the password to login with.|
| replSet | Optional. If the database is set up to use replica sets, define it here so it can be added to the database connection.|
| db\_ssl | Optional. Contains information for SSL connectivity to the database.|
| db\_ssl -> enabled | If SSL is required, set to true.|
| db\_ssl -> accept_invalid_cert | Defines if the adapter should accept invalid certificates (only recommended for lab environments). Required if SSL is enabled. Default is false.|
| db\_ssl -> ca_file | Defines the path name to the CA file used for SSL. If SSL is enabled and the accept invalid certifications is false, then ca_file is required.|
| db\_ssl -> key_file | Defines the path name to the Key file used for SSL. The key_file may be needed for some systems but it is not required for SSL.|
| db\_ssl -> cert_file | Defines the path name to the Certificate file used for SSL. The cert_file may be needed for some systems but it is not required for SSL.|

## Testing an Itential Product Adapter

Mocha is generally used to test all Itential Product Adapters. There are unit tests as well as integration tests performed. Integration tests can generally be run as standalone using mock data and running the adapter in stub mode, or as integrated. When running integrated, every effort is made to prevent environmental failures, however there is still a possibility.

### Unit Testing

Unit Testing includes testing basic adapter functionality as well as error conditions that are triggered in the adapter prior to any integration. There are two ways to run unit tests. The prefered method is to use the testRunner script; however, both methods are provided here.


```bash
node utils/testRunner --unit

npm run test:unit
```

To add new unit tests, edit the `test/unit/adapterTestUnit.js` file. The tests that are already in this file should provide guidance for adding additional tests.

### Integration Testing - Standalone

Standalone Integration Testing requires mock data to be provided with the entities. If this data is not provided, standalone integration testing will fail. When the adapter is set to run in stub mode (setting the stub property to true), the adapter will run through its code up to the point of making the request. It will then retrieve the mock data and return that as if it had received that data as the response from Salesforce. It will then translate the data so that the adapter can return the expected response to the rest of the Itential software. Standalone is the default integration test.

Similar to unit testing, there are two ways to run integration tests. Using the testRunner script is better because it prevents you from having to edit the test script; it will also resets information after testing is complete so that credentials are not saved in the file.

```bash
node utils/testRunner
  answer no at the first prompt

npm run test:integration
```

To add new integration tests, edit the `test/integration/adapterTestIntegration.js` file. The tests that are already in this file should provide guidance for adding additional tests.

### Integration Testing

Integration Testing requires connectivity to Salesforce. By using the testRunner script it prevents you from having to edit the integration test. It also resets the integration test after the test is complete so that credentials are not saved in the file.

> **Note**: These tests have been written as a best effort to make them work in most environments. However, the Adapter Builder often does not have the necessary information that is required to set up valid integration tests. For example, the order of the requests can be very important and data is often required for `creates` and `updates`. Hence, integration tests may have to be enhanced before they will work (integrate) with Salesforce. Even after tests have been set up properly, it is possible there are environmental constraints that could result in test failures. Some examples of possible environmental issues are customizations that have been made within Salesforce which change order dependencies or required data.

```bash
node utils/testRunner
answer yes at the first prompt
answer all other questions on connectivity and credentials
```

Test should also be written to clean up after themselves. However, it is important to understand that in some cases this may not be possible. In addition, whenever exceptions occur, test execution may be stopped, which will prevent cleanup actions from running. It is recommended that tests be utilized in dev and test labs only.

> **Reminder**: Do not check in code with actual credentials to systems.

## Installing an Itential Product Adapter

If you have App-Artifact installed in IAP, you can follow the instruction for that application to install the adapter into IAP. If not, follow these instructions.

1. Set up the name space location in your IAP node_modules.

```bash
cd /opt/pronghorn/current/node_modules
if the @itentialopensource directory does not exist, create it:
   mkdir @itentialopensource
```

1. Clone the adapter into your IAP environment.

```bash
cd \@itentialopensource
git clone git@gitlab.com:\@itentialopensource/adapters/adapter-salesforce
```

1. Install the dependencies for the adapter.

```bash
cd adapter-salesforce
npm install
```

1. If you are running IAP 2019.1 or older, add the adapter properties for Salesforce (created from Adapter Builder) to the `properties.json` file for your Itential build. You will need to change the credentials and possibly the host information below.
[Salesforce sample properties](sampleProperties.json). If you are running IAP 2019.2 the adapter properties need to go into the database. You can review IAP documentation for how to do this.

1. Restart IAP

```bash
systemctl restart pronghorn
```

## Installing a Custom Adapter

If you built this as a custom adapter through the Adapter Builder, it is recommended you go through setting up a development environment and testing the adapter before installing it. There is often configuration and authentication work that is required before the adapter will work in IAP.

1. Move the adapter into the IAP `node_modules` directory.

```text
Depending on where your code is located, this process is different.
    Could be a tar, move, untar
    Could be a git clone of a repository
    Could also be a cp -R from a coding directory
Adapter should be placed into: /opt/pronghorn/current/node_modules/\@itentialopensource
```

1. Follow Steps 3-5 (above) to install an Itential adapter to load your properties, dependencies and restart IAP.

## Using this Adapter

The `adapter.js` file contains the calls the adapter makes available to the rest of the Itential Platform. The API detailed for these calls should be available through JSDOC. The following is a brief summary of the calls.

### Generic Adapter Calls

The `connect` call is run when the Adapter is first loaded by he Itential Platform. It validates the properties have been provided correctly.
```js
connect()
```

The `healthCheck` call ensures that the adapter can communicate with Salesforce. The actual call that is used is defined in the adapter properties.
```js
healthCheck(callback)
```

The `refreshProperties` call provides the adapter the ability to accept property changes without having to restart the adapter.
```js
refreshProperties(properties)
```

The `encryptProperty` call will take the provided property and technique, and return the property encrypted with the technique. This allows the property to be used in the adapterProps section for the credential password so that the password does not have to be in clear text. The adapter will decrypt the property as needed for communications with Salesforce.
```js
encryptProperty(property, technique, callback)
```

The `getQueue` call will return the requests that are waiting in the queue if throttling is enabled.
```js
getQueue(callback)
```

The `addEntityCache` call will take the entities and add the list to the entity cache to expedite performance.
```js
addEntityCache(entityType, entities, key, callback)
```

The `capabilityResults` call will take the results from a verifyCompatibility and put them in the format to be passed back to the Itential Platform.
```js
capabilityResults(results, callback)
```

The `hasEntity` call verifies the adapter has the specific entity.
```js
hasEntity(entityType, entityId, callback)
```

The `verifyCapability` call verifies the adapter can perform the provided action on the specific entity.
```js
verifyCapability(entityType, actionType, entityId, callback)
```

The `updateEntityCache` call will update the entity cache. 
```js
updateEntityCache()
```

### Specific Adapter Calls

Specific adapter calls are built based on the API of the Salesforce. The Adapter Builder creates the proper method comments for generating JS-DOC for the adapter. This is the best way to get information on the calls.

## Troubleshooting the Adapter

### Connectivity Issues

1. Verify the adapter properties are set up correctly.

```text
Go into the Itential Platform GUI and verify/update the properties
```

1. Verify there is connectivity between the Itential Platform Server and Salesforce Server.

```text
ping the ip address of Salesforce server
try telnet to the ip address port of Salesforce
```

1. Verify the credentials provided for Salesforce.

```text
login to Salesforce using the provided credentials
```

1. Verify the API of the call utilized for Salesforce Healthcheck.

```text
Go into the Itential Platform GUI and verify/update the properties
```

### Functional Issues

Adapter logs are located in `/var/log/pronghorn`. In older releases of the Itential Platform, there is a `pronghorn.log` file which contains logs for all of the Itential Platform. In newer versions, adapters are logging into their own files.

## Contributing to Salesforce

Please check out the [Contributing Guidelines](./CONTRIBUTING.md).

## License & Maintainers

### Maintained By

```text
Itential Product Adapters are maintained by the Itential Adapter Team.
Itential OpenSource Adapters are maintained by the community at large.
Custom Adapters are maintained by other sources.
```

### Product License

[Apache 2.0](./LICENSE)
