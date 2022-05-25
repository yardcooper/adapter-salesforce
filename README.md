# Adapter for Salesforce 

## Table of Contents

Some of the page links in this document and links to other GitLab files do not work in Confluence however, the information is available in other sections of the Confluence material.

- [Overview](./SUMMARY.md)
- [Versioning](#versioning)
- [Supported IAP Versions](#supported-iap-versions)
- [Getting Started](#getting-started)
  - [Helpful Background Information](#helpful-background-information)
  - [Prerequisites](#prerequisites)
  - [How to Install](#how-to-install)
  - [Testing](#testing)
- [Configuration](./PROPERTIES.md)
- [Using this Adapter](./CALLS.md)
- [Additional Information](#additional-information)
  - [Enhancements](./ENHANCE.md)
  - [Contributing](./CONTRIBUTING.md)
  - [Helpful Links](#helpful-links)
  - [Node Scripts](#node-scripts)
- [Troubleshoot](./TROUBLESHOOT.md)
- [License and Maintainers](#license-and-maintainers)
- [Product License](#product-license)

## [Overview](./SUMMARY.md)

## Versioning

Itential Product and opensource adapters utilize SemVer for versioning. The current version of the adapter can be found in the `package.json` file or viewed in the IAP GUI on the System page. All Itential opensource adapters can be found in the <a href="https://gitlab.com/itentialopensource/adapters" target="_blank">Itential OpenSource Repository</a>.

Any release prior to 1.0.0 is a pre-release. Initial builds of adapters are generally set up as pre-releases as there is often work that needs to be done to configure the adapter and make sure the authentication process to Salesforce works appropriately.

Release notes can be viewed in CHANGELOG.md or in the <a href="https://itential.atlassian.net/servicedesk/customer/portals" target="_blank">Customer Knowledge Base</a> for Itential adapters.

## Supported IAP Versions

Itential Product adapters are built for particular versions of IAP and packaged with the versions they work with. 

Itential opensource adapter as well as custom adapters built with the Itential Adapter Builder work acoss many releases of IAP. As a result, it is not often necessary to modify an adapter when upgrading IAP. If IAP has changes that impact the pronghorn.json, like adding a new required section, this will most likely require changes to all adapters when upgrading IAP.

Many of the scripts that come with all adapters built using the Itential Adapter Builder do have some dependencies on IAP or the IAP database schema and so it is possible these scripts could stop working in different versions of IAP. If you notify Itential of any issues, the Adapter Team will attempt to fix the scripts for newer releases of IAP.

## Getting Started

These instructions will help you get a copy of the project on your local machine for development and testing. Reading this section is also helpful for deployments as it provides you with pertinent information on prerequisites and properties.

### Helpful Background Information

There is adapter documentation available on the Itential Developer Site <a href="https://www.itential.com/automation-platform/integrations/adapters-resources/" target="_blank">HERE</a>. This documentation includes information and examples that are helpful for:

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
Want to build a new adapter? Use the <a href="https://adapters.itential.io" target="_blank">Itential Adapter Builder</a>

### Prerequisites

The following is a list of required packages for installation on the system the adapter will run on:

```text
Node.js
npm
Git
```

The following list of packages are required for Itential opensource adapters or custom adapters that have been built utilizing the Itential Adapter Builder. You can install these packages by running npm install inside the adapter directory.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Package</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">@itentialopensource/adapter-utils</td>
    <td style="padding:15px">Runtime library classes for all adapters;  includes request handling, connection, authentication throttling, and translation.</td>
  </tr>
  <tr>
    <td style="padding:15px">ajv</td>
    <td style="padding:15px">Required for validation of adapter properties to integrate with Salesforce.</td>
  </tr>
  <tr>
    <td style="padding:15px">axios</td>
    <td style="padding:15px">Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality.</td>
  </tr>
  <tr>
    <td style="padding:15px">commander</td>
    <td style="padding:15px">Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality.</td>
  </tr>
  <tr>
    <td style="padding:15px">fs-extra</td>
    <td style="padding:15px">Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality.</td>
  </tr>
  <tr>
    <td style="padding:15px">mocha</td>
    <td style="padding:15px">Testing library that is utilized by some of the node scripts that are included with the adapter.</td>
  </tr>
  <tr>
    <td style="padding:15px">mocha-param</td>
    <td style="padding:15px">Testing library that is utilized by some of the node scripts that are included with the adapter.</td>
  </tr>
  <tr>
    <td style="padding:15px">mongodb</td>
    <td style="padding:15px">Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality.</td>
  </tr>
  <tr>
    <td style="padding:15px">network-diagnostics</td>
    <td style="padding:15px">Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality.</td>
  </tr>
  <tr>
    <td style="padding:15px">nyc</td>
    <td style="padding:15px">Testing coverage library that is utilized by some of the node scripts that are included with the adapter.</td>
  </tr>
  <tr>
    <td style="padding:15px">readline-sync</td>
    <td style="padding:15px">Utilized by the node script that comes with the adapter;  helps to test unit and integration functionality.</td>
  </tr>
  <tr>
    <td style="padding:15px">semver</td>
    <td style="padding:15px">Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality.</td>
  </tr>
  <tr>
    <td style="padding:15px">winston</td>
    <td style="padding:15px">Utilized by the node scripts that are included with the adapter; helps to build and extend the functionality.</td>
  </tr>
</table>
<br>

If you are developing and testing a custom adapter, or have testing capabilities on an Itential opensource adapter, you will need to install these packages as well.

```text
chai
eslint
eslint-config-airbnb-base
eslint-plugin-import
eslint-plugin-json
package-json-validator
testdouble
```

### How to Install

1. Set up the name space location in your IAP node_modules.

```bash
cd /opt/pronghorn/current/node_modules (* could be in a different place)
if the @itentialopensource directory does not exist, create it:
    mkdir @itentialopensource
```

2. Clone/unzip/tar the adapter into your IAP environment.

```bash
cd \@itentialopensource
git clone git@gitlab.com:\@itentialopensource/adapters/adapter-salesforce
or
unzip adapter-salesforce.zip
or
tar -xvf adapter-salesforce.tar
```

3. Run the adapter install script.

```bash
cd adapter-salesforce
npm run adapter:install
```

4. Restart IAP

```bash
systemctl restart pronghorn
```

5. Change the adapter service instance configuration (host, port, credentials, etc) in IAP Admin Essentials GUI

npm run adapter:install can be dependent on where the adapter is installed and on the version of IAP so it is subject to fail. If this happens you can replace step 3-5 above with these:

3. Install adapter dependencies and check the adapter.

```bash
cd adapter-salesforce
npm run install
npm run lint:errors
npm run test
```

4. Restart IAP

```bash
systemctl restart pronghorn
```

5. Create an adapter service instance configuration in IAP Admin Essentials GUI

6. Copy the properties from the sampleProperties.json and paste them into the service instance configuration in the inner/second properties field.

7. Change the adapter service instance configuration (host, port, credentials, etc) in IAP Admin Essentials GUI

### Testing

Mocha is generally used to test all Itential Opensource Adapters. There are unit tests as well as integration tests performed. Integration tests can generally be run as standalone using mock data and running the adapter in stub mode, or as integrated. When running integrated, every effort is made to prevent environmental failures, however there is still a possibility.

#### Unit Testing

Unit Testing includes testing basic adapter functionality as well as error conditions that are triggered in the adapter prior to any integration. There are two ways to run unit tests. The prefered method is to use the testRunner script; however, both methods are provided here.

```bash
node utils/testRunner --unit

npm run test:unit
npm run test:baseunit
```

To add new unit tests, edit the `test/unit/adapterTestUnit.js` file. The tests that are already in this file should provide guidance for adding additional tests.

#### Integration Testing - Standalone

Standalone Integration Testing requires mock data to be provided with the entities. If this data is not provided, standalone integration testing will fail. When the adapter is set to run in stub mode (setting the stub property to true), the adapter will run through its code up to the point of making the request. It will then retrieve the mock data and return that as if it had received that data as the response from Salesforce. It will then translate the data so that the adapter can return the expected response to the rest of the Itential software. Standalone is the default integration test.

Similar to unit testing, there are two ways to run integration tests. Using the testRunner script is better because it prevents you from having to edit the test script; it will also resets information after testing is complete so that credentials are not saved in the file.

```bash
node utils/testRunner
  answer no at the first prompt

npm run test:integration
```

To add new integration tests, edit the `test/integration/adapterTestIntegration.js` file. The tests that are already in this file should provide guidance for adding additional tests.

#### Integration Testing

Integration Testing requires connectivity to Salesforce. By using the testRunner script it prevents you from having to edit the integration test. It also resets the integration test after the test is complete so that credentials are not saved in the file.

> **Note**: These tests have been written as a best effort to make them work in most environments. However, the Adapter Builder often does not have the necessary information that is required to set up valid integration tests. For example, the order of the requests can be very important and data is often required for `creates` and `updates`. Hence, integration tests may have to be enhanced before they will work (integrate) with Salesforce. Even after tests have been set up properly, it is possible there are environmental constraints that could result in test failures. Some examples of possible environmental issues are customizations that have been made within Salesforce which change order dependencies or required data.

```bash
node utils/testRunner
answer yes at the first prompt
answer all other questions on connectivity and credentials
```

Test should also be written to clean up after themselves. However, it is important to understand that in some cases this may not be possible. In addition, whenever exceptions occur, test execution may be stopped, which will prevent cleanup actions from running. It is recommended that tests be utilized in dev and test labs only.

> **Reminder**: Do not check in code with actual credentials to systems.

## [Configuration](./PROPERTIES.md)

## [Using this Adapter](./CALLS.md)

### [Authentication](./AUTH.md)

## Additional Information

### [Enhancements](./ENHANCE.md)

### [Contributing](./CONTRIBUTING.md)

### Helpful Links

<a href="https://www.itential.com/automation-platform/integrations/adapters-resources/" target="_blank">Adapter Technical Resources</a>

### Node Scripts

There are several node scripts that now accompany the adapter. These scripts are provided to make several activities easier. Many of these scripts can have issues with different versions of IAP as they have dependencies on IAP and Mongo. If you have issues with the scripts please report them to the Itential Adapter Team. Each of these scripts are described below.

<table border="1" class="bordered-table">
  <tr>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Run</span></th>
    <th bgcolor="lightgrey" style="padding:15px"><span style="font-size:12.0pt">Description</span></th>
  </tr>
  <tr>
    <td style="padding:15px">npm run adapter:install</td>
    <td style="padding:15px">Provides an easier way to install the adapter.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run adapter:checkMigrate</td>
    <td style="padding:15px">Checks whether your adapter can and should be migrated to the latest foundation.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run adapter:findPath</td>
    <td style="padding:15px">Can be used to see if the adapter supports a particular API call.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run adapter:migrate</td>
    <td style="padding:15px">Provides an easier way to update your adapter after you download the migration zip from Itential DevSite.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run adapter:update</td>
    <td style="padding:15px">Provides an easier way to update your adapter after you download the update zip from Itential DevSite.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run adapter:revert</td>
    <td style="padding:15px">Allows you to revert after a migration or update if it resulted in issues.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run troubleshoot</td>
    <td style="padding:15px">Provides a way to troubleshoot the adapter - runs connectivity, healthcheck and basic get.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run connectivity</td>
    <td style="padding:15px">Provides a connectivity check to the Salesforce system.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run healthcheck</td>
    <td style="padding:15px">Checks whether the configured healthcheck call works to Salesforce.</td>
  </tr>
  <tr>
    <td style="padding:15px">npm run basicget</td>
    <td style="padding:15px">Checks whether the basic get calls works to Salesforce.</td>
  </tr>
</table>
<br>

## [Troubleshoot](./TROUBLESHOOT.md)

## License and Maintainers

```text
Itential Product Adapters are maintained by the Itential Product Team.
Itential OpenSource Adapters are maintained by the Itential Adapter Team and the community at large.
Custom Adapters are maintained by other sources.
```

## Product License

[Apache 2.0](./LICENSE)
