Salesforce Adapter
===

This adapter is used to integrate the Itential Automation Platform (IAP) with the Salesforce System. The API for Salesforce is available at [undefined API URL]. The adapter utilizes the Salesforce API to provide the integrations that are deemed pertinent to IAP. So it is possible that some integrations are supported through the adapter while other integrations are not.

This Readme file is intended to provide information on this adapter. Itential provides information on all of its product adapters in the Customer Knowledge Base. The information in the [Customer Knowledge Base](https://itential.atlassian.net/servicedesk/customer/portals) is better maintained and goes through documentation reviews, as a result, it should be the first place to go for information. 


## Versioning
Itential Product adapters utilize SemVer for versioning. The current version of the adapter can be found in the package.json file or viewed in the IAP GUI on the System page. For Open Source Adapters, the versions available can be found in the [Itential OpenSource Repository](https://www.npmjs.com/search?q=itentialopensource%2Fadapter).


## Release History
Any release prior to 1.0.0 is a pre-release.

Release notes can be viewed in CHANGELOG.md or in the [Customer Knowledge Base](https://itential.atlassian.net/servicedesk/customer/portals).


## Getting Started
These instructions will help you get a copy of the project on your local maching for development and testing. Reading this section is also helpful for deployments as it provides you pertinent information on prerequisites and properties.

### Environment Prerequisites
The following is a list of packages that are required for working on an adapter.
```
Node.js
Git
```

### Adapter Prerequisites
The following is a list of packages that are required for Itential product adapters or custom adapters that have been built utilizing the Itential Adapter Wizard.

1. @itentialopensource/adapter-utils: Runtime Library classes for all adapters - includes request handling, connection, throttling, and translation
2. ajv: Required for validation of adapter properties to integrate with Salesforce
3. fs-extra: This is utilized by the node scripts that come with the adapter and help build and extend the functionality

### Additional Prerequisites for Development and Testing
If you are developing and testing a custom adapter or have testing capabilities on an Itential product adapter, you will need to install these packages as well.
```
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

### Cloning the Project
Get a local copy of the repository that you can work on along with the adapter dependencies.
```
git clone git@gitlab.com:\@itentialopensource/adapters/adapter-salesforce
npm install
```

### Adapter Properties and Descriptions
This section is to defines **ALL** the properties that are available for the adapter. These properties would be added to your build's _properties.json_'s `adapterProps` section. They are also utilized in the tests that come with the adapter. You do not need to define all of the properties below if you are not using certain capabilities with this adapter. After the properties, there is more detailed information on what each of the properties are for. A better sample of the properties for this adapter that can be used with tests or IAP are provided in the Installation section.
```
  {
    "id": "ALL ADAPTER PROPERTIES!!!",
    "properties": {
      "host": "system.access.resolved",
      "port": 443,
      "base_path": "",
      "version": "v1",
      "cache_location": "local",
      "stub": false,
      "protocol": "https",
      "authentication": {
        "auth_method": "basic user_password",
        "username": "username",
        "password": "password",
        "auth_field": "header.headers.X-AUTH-TOKEN",
        "auth_field_format": "{token}",
        "token": "token",
        "invalid_token_error": 401,
        "token_timeout": 0,
        "token_cache": "local"
      },
      "healthcheck": {
        "type": "startup",
        "frequency": 300000
      },
      "request": {
        "number_retries": 3,
        "limit_retry_error": 401,
        "failover_codes": [404, 405],
        "attempt_timeout": 5000,
        "healthcheck_on_timeout": false,
        "archiving": false
      },
      "ssl": {
        "ecdhCurve": "",
        "enabled": false,
        "accept_invalid_cert": false,
        "ca_file": "",
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
        "avg_runtime": 200
      },
      "proxy": {
        "enabled": false,
        "host": "localhost",
        "port": 9999,
        "protocol": "http"
      }
    },
    "type": "YOUR ADAPTER CLASS"
  }
```
The properties are described below but it is very important to set the host, port, authentication and protocol appropriately.

This information is used for several different purposes --
The host, port, and part of the authentication are required. They are used to connect to Salesforce upon the adapter initially coming up. Depending on the method of authenticating with Salesforce you will not need all of the properties within the authentication (see more below). A connectivity check tells IAP the adapter has loaded successfully. The healthcheck defines the API and properties of the healthcheck which will run to tell the adapter that it can reach Salesforce.

The **host** and **port** are for the Salesforce System. The host can be a fully qualified domain name or an ip address. The **base_path** is used to define part of a path that is consistent for all or most endpoints. It makes the URIs easier to use and maintain but can be overridden on individual calls. An example base_path might be /rest/api. The **version** is used to set a global version for action endpoints. This makes it faster to update the adapter when endpoints change. As with the base-path, version can be overridden on individual endpoints. The **cache_location** can be used to define where the adapter cache is located. The cache is used to maintain an entity list to improve performance. Storage locally is gone when the adapter is restarted while storage in Redis survives an adapter restart. The **stub** property is optional, it indicates whether the stub should be run instead of making calls to Salesforce (very useful during basic testing). The default is false which means connect to Salesforce. The **protocol** property is also optional, it tells the adapter whether to use http or https (http is the default).

The authentication section defines properties of the authentication process to Salesforce. There are many systems and they all seem to authenticate differently. So to support this the authentication system properties have been established. The **auth\_method** is used to define the type of authentication currently supported. Currently supported authentication methods are: "basic user\_password", "static\_token", "request\_token", "no\_authentication". **Username** and **password** are the user and password that will be used to authenticate with Salesforce either on every request or when pulling a token that will be used in subsequent requests. The **auth\_field** defines what field in the requests the authentication (e.g. token are basic auth credentials) needs to be placed into for those calls to work. The **auth\_field\_format** defines the format of the auth\_field. Some examples of authentication field format include:
```
   1) "{token}",
   2) "Token {token}",
   3) "{username}:{password}",
   4) "Basic {b64}{username}:{password}{/b64}"
```
Items in {} are special and inform the adapter to do something prior to sending the data. It may be to replace the item with a value or it may be to encode the item. **token** defines a static token that can be used on all requests, it is only used with static\_token as an auth\_method. The **invalid\_token\_error** defines the error we will receive when the token is invalid. This tells the adapter to pull a new token and retry the request. The **token\_timeout** is a way to tell the adapter when the dynamic token is no longer valid for the user and then the adapter will have to pull a new token. If the token\_timeout is set to -1, the adapter will pull a token on every request to Salesforce. If the timeout\_token is 0, the adapter will pull the expiration from the token response and use that to determine when the token is no longer valid. The **token\_cache** is used to determine where the token should be stored (local memory or in Redis). There may be other fields defined in the propertiesSchema.json. These remaining fields have been deprecated and should no longer be used.

The healthcheck section defines properties related to performing healthchecks on Salesforce. There are currently three **type(s)** of healthchecks:
```
    1) none
    2) startup - only runs a healthcheck on startup
    3) intermittent - will run the healthcheck at the provided frequency.
```
Setting the healthcheck to none is not recommended as it will mean that the adapter never runs a check on Salesforce so there is no way to tell before making a request whether the adapter can talk to Salesforce. Setting the type to startup will tell the adapter that it should check for connectivity when it first comes up but it will not check after that. Setting the type to intermittent means that the adapter will check connectivity to Salesforce at the frequency defined in the **frequency** property. There may be other fields defined in the propertiesSchema.json. These remaining fields have been deprecated and should no longer be used.

The request section defines properties to help handle requests. The **number\_retries** tells the adapter how many times to retry a request that has either aborted or taken the limit error before giving up and returning an error. The **limit\_retry\_error** is http error status number which defines that no capacity was available and thus after waiting a short interval the adapter can retry the request. It is optional and defaults to 0. The **failover\_codes** are an array of error codes for which the adapter will send back a failover flag to IAP so that the Platform can attempt the action in another adapter. The **attempt\_timeout** is how long the adapter should wait before aborting the attempt. On abort, the adapter will do one of two things, it will return the error or if **healthcheck\_on\_timeout** is set to true, it will back off the requests and run a Healthcheck until it re-establishes connectivity to Salesforce and then will re-attempt the request that aborted. The attempt\_timeout is optional and defaults to 5000 milliseconds. The **archiving** flag is optional and defaults to false. It archives the request, the results and the various times (wait time, Salesforce time and overall time) in the *adapterid\_results* collection in Mongo. While archiving might be desirable, before enabling this capability you need to think about how much to archive and develop a strategy for cleaning up the collection in the database so that it does not get too large, especially if the responses are large.

The ssl section defines properties to utilize ssl authentication with Salesforce. If you require SSL then change the **enabled** flag to true. SSL can work two different ways, you can **accept\_invalid\_certs** (only recommended for lab environments) by setting that flag to true or you can provide a **ca\_file**. If SSL is enabled and the accept invalid certifications is false, then the CA\_file is required! You can also specify the **secure\_protocol** for SSL (e.g. SSLv3_method). It also allows you to specify SSL **ciphers** to use. We found during some testing on Node 8 environments that we needed to set **ecdhCurve** to auto. If we did not do that we would receive PROTO errors back when attempting the calls. This is the only usage of this property and to our knowledge it only impacts Node 8 and 9.

The throttle section is all about throttling the requests to Salesforce. All of the properties in this section are optional. Throttle **enabled** defaults to false and simply states whether the adapter should use throttling or not. **number\_pronghorns** defaults to 1 and states whether the throttling is being done in a single IAP instance or whether requests are being throttled across multiple IAP instances. This is an important property for performance enhancements. Throttling in a single IAP instance uses an in-memory queue so there is less overhead. Throttling across multiple IAPs requires putting the request and queue information into a shared resource (e.g. database) so that each Instance can determine what is running and what is next to run. This requires additional IO overhead. **sync-async** is not used at the current time (it is for future expansion of the throttling engine). **max\_in\_queue** represents the maximum number of requests that the adapter should allow into the queue before rejecting requests. This is not necessary a limit on what the adapter can handle but more about timely responses to the requests. The default is currently 1000. **concurrent\_max** defines the number of request that the adapter can send to Salesforce at one time. The default is 1 meaning each request must be sent to Salesforce in a serial manner. **expire_timeout** defaults to 0. This is a graceful timeout of the request session. Meaning that after the request has completed, the adapter will wait the additional expire timeout time (in milliseconds) prior to sending in the next request. Finally, **average\_runtime** is an approximate average of how long it takes Salesforce to handle each request. This is an important number as it has performance implications. If the number is defined too low, it puts extra burden on CPU and memory as the requests will be continually trying to see if they can run. If the number is defined too high, requests may wait longer than they need to before running. The number does not need to be exact but the throttling strategy depends heavily on this number being within reason. If averages range from 50 to 250 milliseconds you might pick an average runtime somewhere in the middle so that when Salesforce performance is exceptional you might be a little slower than you might like but when it is poor you still run efficiently. the default is 200 milliseconds.

The proxy section defines properties to utilize when the Salesforceis behind a proxy server. When this is the case, set the **enabled** flag to true. You will then need to provide the **host** and **port** for the proxy server. In addition, you will need to provide the **protocol** for the proxy server.


## Testing an Itential Product Adapter
Mocha is generally used to test all Itential Product Adapters. There are unit tests as well as integration tests performed. Integration tests can generally be run both standalone by using Mock data and running the adapter in stub mode or integrated. When running integrated, every effort is made to prevent environmental failures but that is still a possibility.

If the test directory has been provided, these tests can be run in the local environment as long as the prerequisite packages have been installed.

For custom adapters, if the same structure is used to build the tests, this process will be the same.

### Unit Testing
Unit Testing includes testing basic adapter functionality as well as error conditions that get triggered in the adapter prior to any integration.
```
npm run test:unit
```

To add new unit tests, edit the test/unit/adapterTestUnit.js file. The tests that are already in this file should provide guidance for adding additional tests.

### Integration Testing - standalone
Standalone Integration Testing requires mock data to be provided with the entities. If this data is not provided, standalone integration testing will fail. When the adapter is set to run in stub mode (setting the stub property to true), the adapter will run through its code up to the point of making the request. It will then retrieve the mock data and return that as if it had received that data as the response from Salesforce. It will then translate the data so that the adapter can return the expected response to the rest of the Itential Platform. Standalone test is the default integration test.
```
npm run test:integration
```

To add new unit tests, edit the test/integration/adapterTestIntegration.js file. The tests that are already in this file should provide guidance for adding additional tests.

### Integration Testing
Integration Testing requires connectivity to Salesforce. To run this test you will have to go into the test/integration directory and edit the test script to update the Salesforce host, port and credentials. In addition, you will have to set stub to false. You may also need to change the timeout depending on the response time from Salesforce.

It is important to note that the tests have been written as a best effort to make them work in most environments. However, it is possible that there are environmental constraints that could result in some to many test failures. Some examples of possible environmental issues are customizations that have been made within Salesforce which change order dependencies or required data.
```
after changing the test script to turn stub to false and provide the credentials
npm run test:integration
```

Test should also be written to clean up after themselves. However, it is important to understand that in some cases this may not be possible! In addition, when test take exceptions the test execution may be stopped preventing cleanup actions from running! It is recommended that tests be utilized in dev and test labs only!

It is important to remember do not check in code with actual credentials to systems.


## Installing an Itential Product Adapter

### Incorporate it into Build Process

1. Add the adapter to the pacakges section of your Hearth blueprint.
```
"@itentialopensource/adapter-salesforce": "0.1.0"
```

2. Run the Hearth build process

3. Install the dependencies for the adapter:
```
    cd /opt/pronghorn/current/node_modules/\@itentialopensource/adapter-salesforce
    npm install
```

4. Add the adapter properties below to your IAP properties.json.
```
Adapter Properties for Salesforce (created from adapter-wizard). You will need to change the credentials and possibly the host information below.
Inside your build's _properties.json_. add the following to the `adapterProps` section:
```
```
{
    "type": "Salesforce",
    "id": "salesforce",
    "properties": {
        "authentication": {
            "auth_method": "request_token",
            "auth_field": "header.headers.X-AUTH-TOKEN",
            "auth_field_format": "{token}",
            "username": "username",
            "password": "password",
            "token_timeout": 1800000,
            "token_cache": "local",
            "invalid_token_error": 401
        },
        "healthcheck": {
            "type": "startup"
        },
        "host": "salesforce",
        "port": 443,
        "base_path": "//api",
        "version": "v1",
        "cache_location": "none",
        "protocol": "https",
        "stub": true,
        "request": {
            "number_retries": 3,
            "limit_retry_error": 0,
            "attempt_timeout": 5000,
            "healthcheck_on_timeout": true,
            "archiving": false
        }
    }
}
```

5. Restart IAP
```
systemctl restart pronghorn
```

### Install into an Existing Itential Platform Environment

1. Set up our npm to access the Itential OpenSource repository
```
npm config set @itentialopensource:registry https://registry.npmjs.org
```

2. Run npm install of the adapter
```
cd /opt/pronghorn/current
npm install adapter-salesforce
```

3. Follow step 3 thru 5 above to load your properties, dependencies and restart IAP.


## Installing a Custom Adapter

1. Move the adapter into the IAP node_modules directory.
```
Depending on where your code is located, this process is different.
    Could be a tar, move, untar
    Could be a git clone of a repository
    Could also be a cp -R from a coding directory
Adapter should be placed into: /opt/pronghorn/current/node_modules/\@itentialopensource
```

2. Follow step 3 thru 5 for installing an Itential adapter to load your properties, dependencies and restart IAP.


## Using this Adapter
The adapter.js file contains the calls that the adapter makes available to the rest of the Itential Platform. The API detailed for these calls should be available through JSDOC. This is just a brief summary of the calls.

### Generic Adapter Calls
```
connect()
The connect call is run when the Adapter is first loaded by he Itential Platform. It validates the
properties have been provided correctly.
```
```
healthCheck(callback)
Insures that the adapter can communicate with Salesforce. The actual call that is used is
defined in the adapter properties.
```
```
encryptProperty(property, technique, callback)
Will take the provided property and technique and return the property encrypted with the technique such that the property can be used in the adapter properties for the credential password so that the password does not have to be in clear text. The adapter will decrypt the property as needed for communications with Salesforce.
```
```
addEntityCache(entityType, entities, key, callback)
Will take the entities and add the list to the entity cache to expedite performance.
```
```
capabilityResults(results, callback)
Will take the results from a verifyCompatibility and put them in the format to be passed back to the Itential Platform.
```
```
hasEntity(entityType, entityId, callback)
Verifies that this adapter has the specific entity.
```
```
verifyCapability(entityType, actionType, entityId, callback)
Verifies that this adapter can perform the provided action on the specific entity.
```
```
updateEntityCache()
Call to update the entity cache.
```

### Specific Adapter Calls
Specific adapter calls are built based on the API of the Salesforce. The adapter-wizard creates the proper method comments for generating JS-DOC for the adapter. This is the best way to get information on the calls.


## Troubleshooting this adapter

### Connectivity Issues

1. Ensure the adapter properties are set up correctly
```
Go into the Itential Platform GUI and verify/update the properties
```

2. Ensure that there is connectivity between the Itential Platform Server and Salesforce Server
```
ping the ip address of Salesforce server
try telnet to the ip address port of Salesforce
```

3. Verify the credentials provided for Salesforce
```
login to Salesforce using the provided credentials
```

4. Verify the API of the call utilized for Salesforce Healthcheck
```
Go into the Itential Platform GUI and verify/update the properties
```

### Functional Issues
The logs for this adapter should be located in /var/log/pronghorn. In older releases of the Itential Platform, there is a pronghorn.log file which contains logs for all of the Itential Platform. In newer versions, adapters are logging into their own files.


## Contributing to Salesforce
Please check out the [Contributing Guidelines](./CONTRIBUTING.md).


License & Maintainers
---

### Maintained by:
```
Itential Product Adapters are maintained by the Itential Adapter Team.
Itential OpenSource Adapters are maintained by the community at large.
Custom Adapters are maintained by other sources.
```

### Product License

[Apache 2.0](./LICENSE)
