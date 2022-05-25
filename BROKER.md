## Integrating Salesforce Adapter with IAP Device Broker

This document will go through the steps for integrating the Salesforce adapter with IAP's Device Broker. IAP Device Broker integration allows for easier interation into several of IAPs applications (e.g. Configuration Manager). Properly configuring the properties for the adapter in IAP is critical for getting the device broker integration to work. Their is additional information in the configuration section of the adapter readme. This document will go through each of the calls that are utilized by the Device Broker.

### getDevicesFiltered
getDevicesFiltered(options, callback) → This call returns all of the devices within Salesforce that match the provided filter.

#### input

options {object}: defines the options for the search. At current filter is the most important one. The filter can contain the device name (e.g. the options can be { filter: { name: [‘abc’,  ‘def’] }}. The adapter currently filters by doing a contains on the name(s) provided in the array and not an exact match. So deviceabc will be returned when this filter is applied. In many adapters, other options (start, limit, sort and order) are not implemented.

#### output

An Object containing the total number of matching devices and a list containing an array of the details for each device. For example, { total: 2, list: [ { name: ‘abc’, ostype: ‘type’, port: 80, ipaddress: ‘10.10.10.10’ }, { name: ‘def’, ostype: ‘type2’, port: 443, ipaddress: ‘10.10.10.15’ }] }

The fields name and ostype are required by the broker and should be mapped through properties to data from the other system. In addition, ipaddress and port should also be mapped as it is utilized by some north bound IAP applications (e.g. Config Manager). There are other fields that can be set as well but consider these the minimal fields.

Below is an example of how you may set up the properties for this call.

```json
"getDevicesFiltered": [
  {
    "path": "/{org}/get/devices",
    "method": "GET",
    "query": {},
    "body": {},
    "headers": {},
    "handleFailure": "ignore",
    "requestFields": {
      "org": "555"
    },
    "responseFields": {
      "name": "host",
      "ostype": "os",
      "ostypePrefix": "system-",
      "ipaddress": "attributes.ipaddr",
      "port": "443"
    }
  },
  {
    "path": "/{org}/get/devices",
    "method": "GET",
    "query": {},
    "body": {},
    "headers": {},
    "handleFailure": "ignore",
    "requestFields": {
      "org": "777"
    },
    "responseFields": {
      "name": "host",
      "ostype": "os",
      "ostypePrefix": "system-",
      "ipaddress": "attributes.ipaddr",
      "port": "443",
      "myorg": "org"
    }
  }
]
```

Notice with the path, there is a variable in it ({org}). This variable must be provided in the data available to the call. For getDevicesFiltered this means the requestFields as a static value. In other calls, it may also come from the result of the getDevicesFiltered call.

Notice with the responseFields, it wants the IAP data key as the key and where it is supposed to find the data in the response as the value. You can use nested fields in the response object using standard object notation. You can also add static data as shown in the port field. Finally, you can append data to the response from the requestInformation using its key (e.g. org). The ostypePrefix is a special field that allows you to add static data to the ostype to help define the system you are getting the device from.

Notice here that you can also have multiple calls that make up the results provided to the Device Broker. In this example we are making calls to two different organizations and returning the results from both. 

### isAlive
isAlive(deviceName, callback) → This call returns whether the device provided is operational.

input

deviceName {string}: the name of the device to get details of. The adapter will always call getDevicesFiltered first with this name in the filter in order to get any additional details it needs for this call (e.g. id).

output

A boolean value. This usually needs to be determined from a particular field in the data returned from the other system. This is where definind a status value and a status field is critical to properly configuring the call.

Below is an example of how you may set up the properties for this call.

```json
"isAlive": [
  {
    "path": "/{org}/get/devices/{id}/status",
    "method": "GET",
    "query": {},
    "body": {},
    "headers": {},
    "handleFailure": "ignore",
    "statusValue": "online",
    "requestFields": {
      "org": "myorg",
      "id": "name"
    },
    "responseFields": {
      "status": "status"
    }
  }
]
```

Notice with the requestFields, it will use the org and name that it got from the response of the getDevicesFiltered call to complete the path for the call.

Notice with the responseFields, it use the status field that came back and test to see if the value is online since that is what you defined as the statusValue. If it is it will return true otherwise it will return false.

You could have multiple calls here if needed but generally that will not be the case.

### getConfig
getConfig(deviceName, format, callback) → This call returns the configuration for the device. This can be a simple call or a complex/multiple calls to get all of the “configuration” desirable.

input

deviceName {string}: the name of the device to get details of. The adapter will always call getDevicesFiltered first with this name in the filter in order to get any additional details it needs for this call (e.g. id).

format {string}: is an optional format you want provided back. Most adapters do not support formats by default and just return the “stringified” json object.

output

An object containing a response field which has the value of the stringified config (e.g. { response: ‘stringified configuration data’ }

Below is an example of how you may set up the properties for this call.

```json
"getConfig": [
  {
    "path": "/{org}/get/devices/{id}/configPart1",
    "method": "GET",
    "query": {},
    "body": {},
    "headers": {},
    "handleFailure": "ignore",
    "requestFields": {
      "org": "myorg",
      "id": "name"
    }
    "responseFields": {}
  },
  {
    "path": "/{org}/get/devices/configPart2",
    "method": "GET",
    "query": {},
    "body": {},
    "headers": {},
    "handleFailure": "ignore",
    "requestFields": {
      "org": "myorg"
    }
    "responseFields": {}
  }
]
```

The example above shows multiple calls. With the handleFailure property set to ignore, if one of the calls fails, the adapter will still send the response with that configuration missing. If you want it to fail set the handleFailure property to fail.

There is no limit on the number of calls you can make however understand that the adapter will make all of these calls prior to providing a response so there can be performance implications.

### getDevice - may be deprecated
getDevice(deviceName, callback) → This call returns details of the device provided. In many systems the getDevicesFiltered only returns summary information and so we also want a more detailed call to get device details.

input

deviceName {string}: the name of the device to get details of. The adapter will always call getDevicesFiltered first with this name in the filter in order to get any additional details it needs for this call (e.g. id).

output

An Object containing the details of the device. The object should contain at least the same information that was provided in the getDevicesFiltered call (e.g. the fields name, ostype, port and ipaddress should be mapped in the adapter properties to data from the other system) and may contain many more details about the device.

Below is an example of how you may set up the properties for this call.

```json
"getDevice": [
  {
    "path": "/{org}/get/device",
    "method": "GET",
    "query": {
      "id": "{id}"
    },
    "body": {},
    "headers": {},
    "handleFailure": "ignore",
    "requestFields": {
      "org": "myorg",
      "id": "name"
    },
    "responseFields": {
      "name": "host",
      "ostype": "os",
      "ostypePrefix": "system-",
      "ipaddress": "attributes.ipaddr",
      "port": "443",
      "myorg": "org"
    }
  }
]
```

In this example, we show a query parameter being used. Notice that the value is still provided via the requestFields and then like with the path, we use curly braces in the query to denote a variable. The body and header variables work in this same manner.

You could have multiple calls here if needed but generally that will not be the case.
