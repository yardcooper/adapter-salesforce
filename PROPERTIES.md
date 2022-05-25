## Configuration

This section defines **all** the properties that are available for the adapter, including detailed information on what each property is for. If you are not using certain capabilities with this adapter, you do not need to define all of the properties. An example of how the properties for this adapter can be used with tests or IAP are provided in the sampleProperties.

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
      "encode_queryvars": true,
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
        "auth_field_format": "{token}",
        "auth_logging": false,
        "client_id": "",
        "client_secret": "",
        "grant_type": ""
      },
      "healthcheck": {
        "type": "startup",
        "frequency": 300000,
        "query_object": {}
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
        "archiving": false,
        "return_request": false
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
        "protocol": "http",
        "username": "",
        "password": "",
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
      },
      "devicebroker": {
        "getDevice": [
          {
            "path": "/call/to/get/device/details",
            "method": "GET",
            "query": {},
            "body": {},
            "headers": {},
            "handleFailure": "ignore",
            "requestFields": {},
            "responseFields": {}
          }
        ],
        "getDevicesFiltered": [
          {
            "path": "/call/to/get/devices",
            "method": "GET",
            "query": {},
            "body": {},
            "headers": {},
            "handleFailure": "ignore",
            "requestFields": {},
            "responseFields": {}
          }
        ],
        "isAlive": [
          {
            "path": "/call/to/get/device/status",
            "method": "GET",
            "query": {},
            "body": {},
            "headers": {},
            "handleFailure": "ignore",
            "statusValue": "valueIfAlive"
            "requestFields": {},
            "responseFields": {}
          }
        ],
        "getConfig": [
          {
            "path": "/call/to/get/device/config",
            "method": "GET",
            "query": {},
            "body": {},
            "headers": {},
            "handleFailure": "ignore",
            "requestFields": {},
            "responseFields": {}
          }
        ],
        "getCount": [
          {
            "path": "/call/to/get/devices",
            "method": "GET",
            "query": {},
            "body": {},
            "headers": {},
            "handleFailure": "ignore"
          }
        ]
      }
    },
    "type": "YOUR ADAPTER CLASS"
  }
```

### Connection Properties

These base properties are used to connect to Salesforce upon the adapter initially coming up. It is important to set these properties appropriately.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">host</td>
    <td style="padding:15px">Required. A fully qualified domain name or IP address.</td>
  </tr>
  <tr>
    <td style="padding:15px">port</td>
    <td style="padding:15px">Required. Used to connect to the server.</td>
  </tr>
  <tr>
    <td style="padding:15px">base_path</td>
    <td style="padding:15px">Optional. Used to define part of a path that is consistent for all or most endpoints. It makes the URIs easier to use and maintain but can be overridden on individual calls. An example **base_path** might be `/rest/api`. Default is ``.</td>
  </tr>
  <tr>
    <td style="padding:15px">version</td>
    <td style="padding:15px">Optional. Used to set a global version for action endpoints. This makes it faster to update the adapter when endpoints change. As with the base-path, version can be overridden on individual endpoints. Default is ``.</td>
  </tr>
  <tr>
    <td style="padding:15px">cache_location</td>
    <td style="padding:15px">Optional. Used to define where the adapter cache is located. The cache is used to maintain an entity list to improve performance. Storage locally is lost when the adapter is restarted. Storage in Redis is preserved upon adapter restart. Default is none which means no caching of the entity list.</td>
  </tr>
  <tr>
    <td style="padding:15px">encode_pathvars</td>
    <td style="padding:15px">Optional. Used to tell the adapter to encode path variables or not. The default behavior is to encode them so this property can be used to stop that behavior.</td>
  </tr>
  <tr>
    <td style="padding:15px">encode_queryvars</td>
    <td style="padding:15px">Optional. Used to tell the adapter to encode query parameters or not. The default behavior is to encode them so this property can be used to stop that behavior.</td>
  </tr>
  <tr>
    <td style="padding:15px">save_metric</td>
    <td style="padding:15px">Optional. Used to tell the adapter to save metric information (this does not impact metrics returned on calls). This allows the adapter to gather metrics over time. Metric data can be stored in a database or on the file system.</td>
  </tr>
  <tr>
    <td style="padding:15px">stub</td>
    <td style="padding:15px">Optional. Indicates whether the stub should run instead of making calls to Salesforce (very useful during basic testing). Default is false (which means connect to Salesforce).</td>
  </tr>
  <tr>
    <td style="padding:15px">protocol</td>
    <td style="padding:15px">Optional. Notifies the adapter whether to use HTTP or HTTPS. Default is HTTP.</td>
  </tr>
</table>
<br>

A connectivity check tells IAP the adapter has loaded successfully.

### Authentication Properties

The following properties are used to define the authentication process to Salesforce.

>**Note**: Depending on the method that is used to authenticate with Salesforce, you may not need to set all of the authentication properties.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">auth_method</td>
    <td style="padding:15px">Required. Used to define the type of authentication currently supported. Authentication methods currently supported are: `basic user_password`, `static_token`, `request_token`, and `no_authentication`.</td>
  </tr>
  <tr>
    <td style="padding:15px">username</td>
    <td style="padding:15px">Used to authenticate with Salesforce on every request or when pulling a token that will be used in subsequent requests.</td>
  </tr>
  <tr>
    <td style="padding:15px">password</td>
    <td style="padding:15px">Used to authenticate with Salesforce on every request or when pulling a token that will be used in subsequent requests.</td>
  </tr>
  <tr>
    <td style="padding:15px">token</td>
    <td style="padding:15px">Defines a static token that can be used on all requests. Only used with `static_token` as an authentication method (auth\_method).</td>
  </tr>
  <tr>
    <td style="padding:15px">invalid_token_error</td>
    <td style="padding:15px">Defines the HTTP error that is received when the token is invalid. Notifies the adapter to pull a new token and retry the request. Default is 401.</td>
  </tr>
  <tr>
    <td style="padding:15px">token_timeout</td>
    <td style="padding:15px">Defines how long a token is valid. Measured in milliseconds. Once a dynamic token is no longer valid, the adapter has to pull a new token. If the token_timeout is set to -1, the adapter will pull a token on every request to Salesforce. If the timeout_token is 0, the adapter will use the expiration from the token response to determine when the token is no longer valid.</td>
  </tr>
  <tr>
    <td style="padding:15px">token_cache</td>
    <td style="padding:15px">Used to determine where the token should be stored (local memory or in Redis).</td>
  </tr>
  <tr>
    <td style="padding:15px">auth_field</td>
    <td style="padding:15px">Defines the request field the authentication (e.g., token are basic auth credentials) needs to be placed in order for the calls to work.</td>
  </tr>
  <tr>
    <td style="padding:15px">auth_field_format</td>
    <td style="padding:15px">Defines the format of the auth\_field. See examples below. Items enclosed in {} inform the adapter to perofrm an action prior to sending the data. It may be to replace the item with a value or it may be to encode the item.</td>
  </tr>
  <tr>
    <td style="padding:15px">auth_logging</td>
    <td style="padding:15px">Setting this true will add some additional logs but this should only be done when trying to debug an issue as certain credential information may be logged out when this is true.</td>
  </tr>
  <tr>
    <td style="padding:15px">client_id</td>
    <td style="padding:15px">Provide a client id when needed, this is common on some types of OAuth.</td>
  </tr>
  <tr>
    <td style="padding:15px">client_secret</td>
    <td style="padding:15px">Provide a client secret when needed, this is common on some types of OAuth.</td>
  </tr>
  <tr>
    <td style="padding:15px">grant_type</td>
    <td style="padding:15px">Provide a grant type when needed, this is common on some types of OAuth.</td>
  </tr>
</table>
<br>

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

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">type</td>
    <td style="padding:15px">Required. The type of health check to run.</td>
  </tr>
  <tr>
    <td style="padding:15px">frequency</td>
    <td style="padding:15px">Required if intermittent. Defines how often the health check should run. Measured in milliseconds. Default is 300000.</td>
  </tr>
  <tr>
    <td style="padding:15px">query_object</td>
    <td style="padding:15px">Query parameters to be added to the adapter healthcheck call.</td>
  </tr>
</table>
<br>

### Request Properties

The request section defines properties to help handle requests.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">number_redirects</td>
    <td style="padding:15px">Optional. Tells the adapter that the request may be redirected and gives it a maximum number of redirects to allow before returning an error. Default is 0 - no redirects.</td>
  </tr>
  <tr>
    <td style="padding:15px">number_retries</td>
    <td style="padding:15px">Tells the adapter how many times to retry a request that has either aborted or reached a limit error before giving up and returning an error.</td>
  </tr>
  <tr>
    <td style="padding:15px">limit_retry_error</td>
    <td style="padding:15px">Optional. Can be either an integer or an array. Indicates the http error status number to define that no capacity was available and, after waiting a short interval, the adapter can retry the request. If an array is provvided, the array can contain integers or strings. Strings in the array are used to define ranges (e.g. "502-506"). Default is [0].</td>
  </tr>
  <tr>
    <td style="padding:15px">failover_codes</td>
    <td style="padding:15px">An array of error codes for which the adapter will send back a failover flag to IAP so that the Platform can attempt the action in another adapter.</td>
  </tr>
  <tr>
    <td style="padding:15px">attempt_timeout</td>
    <td style="padding:15px">Optional. Tells how long the adapter should wait before aborting the attempt. On abort, the adapter will do one of two things: 1) return the error; or 2) if **healthcheck\_on\_timeout** is set to true, it will abort the request and run a Healthcheck until it re-establishes connectivity to Salesforce, and then will re-attempt the request that aborted. Default is 5000 milliseconds.</td>
  </tr>
  <tr>
    <td style="padding:15px">global_request</td>
    <td style="padding:15px">Optional. This is information that the adapter can include in all requests to the other system. This is easier to define and maintain than adding this information in either the code (adapter.js) or the action files.</td>
  </tr>
  <tr>
    <td style="padding:15px">global_request -> payload</td>
    <td style="padding:15px">Optional. Defines any information that should be included on all requests sent to the other system that have a payload/body.</td>
  </tr>
  <tr>
    <td style="padding:15px">global_request -> uriOptions</td>
    <td style="padding:15px">Optional. Defines any information that should be sent as untranslated  query options (e.g. page, size) on all requests to the other system.</td>
  </tr>
  <tr>
    <td style="padding:15px">global_request -> addlHeaders</td>
    <td style="padding:15px">Optioonal. Defines any headers that should be sent on all requests to the other system.</td>
  </tr>
  <tr>
    <td style="padding:15px">global_request -> authData</td>
    <td style="padding:15px">Optional. Defines any additional authentication data used to authentice with the other system. This authData needs to be consistent on every request.</td>
  </tr>
  <tr>
    <td style="padding:15px">healthcheck_on_timeout</td>
    <td style="padding:15px">Required. Defines if the adapter should run a health check on timeout. If set to true, the adapter will abort the request and run a health check until it re-establishes connectivity and then it will re-attempt the request.</td>
  </tr>
  <tr>
    <td style="padding:15px">return_raw</td>
    <td style="padding:15px">Optional. Tells the adapter whether the raw response should be returned as well as the IAP response. This is helpful when running integration tests to save mock data. It does add overhead to the response object so it is not ideal from production.</td>
  </tr>
  <tr>
    <td style="padding:15px">archiving</td>
    <td style="padding:15px">Optional flag. Default is false. It archives the request, the results and the various times (wait time, Salesforce time and overall time) in the `adapterid_results` collection in MongoDB. Although archiving might be desirable, be sure to develop a strategy before enabling this capability. Consider how much to archive and what strategy to use for cleaning up the collection in the database so that it does not become too large, especially if the responses are large.</td>
  </tr>
  <tr>
    <td style="padding:15px">return_request</td>
    <td style="padding:15px">Optional flag. Default is false. Will return the actual request that is made including headers. This should only be used during debugging issues as there could be credentials in the actual request.</td>
  </tr>
</table>
<br>

### SSL Properties

The SSL section defines the properties utilized for ssl authentication with Salesforce. SSL can work two different ways: set the `accept\_invalid\_certs` flag to true (only recommended for lab environments), or provide a `ca\_file`.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">enabled</td>
    <td style="padding:15px">If SSL is required, set to true.</td>
  </tr>
  <tr>
    <td style="padding:15px">accept_invalid_certs</td>
    <td style="padding:15px">Defines if the adapter should accept invalid certificates (only recommended for lab environments). Required if SSL is enabled. Default is false.</td>
  </tr>
  <tr>
    <td style="padding:15px">ca_file</td>
    <td style="padding:15px">Defines the path name to the CA file used for SSL. If SSL is enabled and the accept invalid certifications is false, then ca_file is required.</td>
  </tr>
  <tr>
    <td style="padding:15px">key_file</td>
    <td style="padding:15px">Defines the path name to the Key file used for SSL. The key_file may be needed for some systems but it is not required for SSL.</td>
  </tr>
  <tr>
    <td style="padding:15px">cert_file</td>
    <td style="padding:15px">Defines the path name to the Certificate file used for SSL. The cert_file may be needed for some systems but it is not required for SSL.</td>
  </tr>
  <tr>
    <td style="padding:15px">secure_protocol</td>
    <td style="padding:15px">Defines the protocol (e.g., SSLv3_method) to use on the SSL request.</td>
  </tr>
  <tr>
    <td style="padding:15px">ciphers</td>
    <td style="padding:15px">Required if SSL enabled. Specifies a list of SSL ciphers to use.</td>
  </tr>
  <tr>
    <td style="padding:15px">ecdhCurve</td>
    <td style="padding:15px">During testing on some Node 8 environments, you need to set `ecdhCurve` to auto. If you do not, you will receive PROTO errors when attempting the calls. This is the only usage of this property and to our knowledge it only impacts Node 8 and 9.</td>
  </tr>
</table>
<br>

### Throttle Properties

The throttle section is used when requests to Salesforce must be queued (throttled). All of the properties in this section are optional.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">throttle_enabled</td>
    <td style="padding:15px">Default is false. Defines if the adapter should use throttling or not.</td>
  </tr>
  <tr>
    <td style="padding:15px">number_pronghorns</td>
    <td style="padding:15px">Default is 1. Defines if throttling is done in a single Itential instance or whether requests are being throttled across multiple Itential instances (minimum = 1, maximum = 20). Throttling in a single Itential instance uses an in-memory queue so there is less overhead. Throttling across multiple Itential instances requires placing the request and queue information into a shared resource (e.g. database) so that each instance can determine what is running and what is next to run. Throttling across multiple instances requires additional I/O overhead.</td>
  </tr>
  <tr>
    <td style="padding:15px">sync-async</td>
    <td style="padding:15px">This property is not used at the current time (it is for future expansion of the throttling engine).</td>
  </tr>
  <tr>
    <td style="padding:15px">max_in_queue</td>
    <td style="padding:15px">Represents the maximum number of requests the adapter should allow into the queue before rejecting requests (minimum = 1, maximum = 5000). This is not a limit on what the adapter can handle but more about timely responses to requests. The default is currently 1000.</td>
  </tr>
  <tr>
    <td style="padding:15px">concurrent_max</td>
    <td style="padding:15px">Defines the number of requests the adapter can send to Salesforce at one time (minimum = 1, maximum = 1000). The default is 1 meaning each request must be sent to Salesforce in a serial manner.</td>
  </tr>
  <tr>
    <td style="padding:15px">expire_timeout</td>
    <td style="padding:15px">Default is 0. Defines a graceful timeout of the request session. After a request has completed, the adapter will wait additional time prior to sending the next request. Measured in milliseconds (minimum = 0, maximum = 60000).</td>
  </tr>
  <tr>
    <td style="padding:15px">average_runtime</td>
    <td style="padding:15px">Represents the approximate average of how long it takes Salesforce to handle each request. Measured in milliseconds (minimum = 50, maximum = 60000). Default is 200. This metric has performance implications. If the runtime number is set too low, it puts extra burden on the CPU and memory as the requests will continually try to run. If the runtime number is set too high, requests may wait longer than they need to before running. The number does not need to be exact but your throttling strategy depends heavily on this number being within reason. If averages range from 50 to 250 milliseconds you might pick an average run-time somewhere in the middle so that when Salesforce performance is exceptional you might run a little slower than you might like, but when it is poor you still run efficiently.</td>
  </tr>
  <tr>
    <td style="padding:15px">priorities</td>
    <td style="padding:15px">An array of priorities and how to handle them in relation to the throttle queue. Array of objects that include priority value and percent of queue to put the item ex { value: 1, percent: 10 }</td>
  </tr>
</table>
<br>

### Proxy Properties

The proxy section defines the properties to utilize when Salesforce is behind a proxy server.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">enabled</td>
    <td style="padding:15px">Required. Default is false. If Salesforce is behind a proxy server, set enabled flag to true.</td>
  </tr>
  <tr>
    <td style="padding:15px">host</td>
    <td style="padding:15px">Host information for the proxy server. Required if `enabled` is true.</td>
  </tr>
  <tr>
    <td style="padding:15px">port</td>
    <td style="padding:15px">Port information for the proxy server. Required if `enabled` is true.</td>
  </tr>
  <tr>
    <td style="padding:15px">protocol</td>
    <td style="padding:15px">The protocol (i.e., http, https, etc.) used to connect to the proxy. Default is http.</td>
  </tr>
  <tr>
    <td style="padding:15px">username</td>
    <td style="padding:15px">If there is authentication for the proxy, provide the username here.</td>
  </tr>
  <tr>
    <td style="padding:15px">password</td>
    <td style="padding:15px">If there is authentication for the proxy, provide the password here.</td>
  </tr>
</table>
<br>

### Mongo Properties

The mongo section defines the properties used to connect to a Mongo database. Mongo can be used for throttling as well as to persist metric data. If not provided, metrics will be stored in the file system.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">host</td>
    <td style="padding:15px">Optional. Host information for the mongo server.</td>
  </tr>
  <tr>
    <td style="padding:15px">port</td>
    <td style="padding:15px">Optional. Port information for the mongo server.</td>
  </tr>
  <tr>
    <td style="padding:15px">database</td>
    <td style="padding:15px">Optional. The database for the adapter to use for its data.</td>
  </tr>
  <tr>
    <td style="padding:15px">username</td>
    <td style="padding:15px">Optional. If credentials are required to access mongo, this is the user to login as.</td>
  </tr>
  <tr>
    <td style="padding:15px">password</td>
    <td style="padding:15px">Optional. If credentials are required to access mongo, this is the password to login with.</td>
  </tr>
  <tr>
    <td style="padding:15px">replSet</td>
    <td style="padding:15px">Optional. If the database is set up to use replica sets, define it here so it can be added to the database connection.</td>
  </tr>
  <tr>
    <td style="padding:15px">db_ssl</td>
    <td style="padding:15px">Optional. Contains information for SSL connectivity to the database.</td>
  </tr>
  <tr>
    <td style="padding:15px">db_ssl -> enabled</td>
    <td style="padding:15px">If SSL is required, set to true.</td>
  </tr>
  <tr>
    <td style="padding:15px">db_ssl -> accept_invalid_cert</td>
    <td style="padding:15px">Defines if the adapter should accept invalid certificates (only recommended for lab environments). Required if SSL is enabled. Default is false.</td>
  </tr>
  <tr>
    <td style="padding:15px">db_ssl -> ca_file</td>
    <td style="padding:15px">Defines the path name to the CA file used for SSL. If SSL is enabled and the accept invalid certifications is false, then ca_file is required.</td>
  </tr>
  <tr>
    <td style="padding:15px">db_ssl -> key_file</td>
    <td style="padding:15px">Defines the path name to the Key file used for SSL. The key_file may be needed for some systems but it is not required for SSL.</td>
  </tr>
  <tr>
    <td style="padding:15px">db_ssl -> cert_file</td>
    <td style="padding:15px">Defines the path name to the Certificate file used for SSL. The cert_file may be needed for some systems but it is not required for SSL.</td>
  </tr>
</table>
<br>

### Device Broker Properties

The device broker section defines the properties used integrate Salesforce to the device broker. Each broker call is represented and has an array of calls that can be used to build the response. This describes the calls and then the fields which are available in the calls.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Property</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">getDevice</td>
    <td style="padding:15px">The array of calls used to get device details for the broker</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevicesFiltered</td>
    <td style="padding:15px">The array of calls used to get devices for the broker</td>
  </tr>
  <tr>
    <td style="padding:15px">isAlive</td>
    <td style="padding:15px">The array of calls used to get device status for the broker</td>
  </tr>
  <tr>
    <td style="padding:15px">getConfig</td>
    <td style="padding:15px">The array of calls used to get device configuration for the broker</td>
  </tr>
  <tr>
    <td style="padding:15px">getCount</td>
    <td style="padding:15px">The array of calls used to get device configuration for the broker</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig/getCount -> path</td>
    <td style="padding:15px">The path, not including the base_path and version, for making this call</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig/getCount -> method</td>
    <td style="padding:15px">The rest method for making this call</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig/getCount -> query</td>
    <td style="padding:15px">Query object containing and query parameters and their values for this call</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig/getCount -> body</td>
    <td style="padding:15px">Body object containing the payload for this call</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig/getCount -> headers</td>
    <td style="padding:15px">Header object containing the headers for this call.</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig/getCount -> handleFailure</td>
    <td style="padding:15px">Tells the adapter whether to "fail" or "ignore" failures if they occur.</td>
  </tr>
  <tr>
    <td style="padding:15px">isAlive -> statusValue</td>
    <td style="padding:15px">Tells the adapter what value to look for in the status field to determine if the device is alive.</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig -> requestFields</td>
    <td style="padding:15px">Object containing fields the adapter should send on the request and where it should get the data. The where can be from a response to a getDevicesFiltered or a static value.</td>
  </tr>
  <tr>
    <td style="padding:15px">getDevice/getDevicesFiltered/isAlive/getConfig -> responseFields</td>
    <td style="padding:15px">Object containing fields the adapter should set to send back to iap and where the value should come from in the response or request data.</td>
  </tr>
</table>
<br>

