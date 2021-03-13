/* @copyright Itential, LLC 2020 */

/* global describe it context before after */
/* eslint no-unused-vars: warn */

const mocha = require('mocha');
const assert = require('assert');
const diagnostics = require('network-diagnostics');

let host;
process.argv.forEach((val) => {
  if (val.indexOf('--HOST') === 0) {
    [, host] = val.split('=');
  }
});

describe('[integration] Adapter Test', () => {
  context(`Testing network connection on ${host}`, () => {
    before(() => {
      diagnostics.setTestURL(host);
    });

    after((done) => {
      done();
    });

    it('DNS resolve', (done) => {
      diagnostics.haveDNS((result) => {
        try {
          assert.equal(result, true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('Responds to ping', (done) => {
      diagnostics.havePing((result) => {
        try {
          assert.equal(result, true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('Support HTTP on port 80', (done) => {
      diagnostics.haveHTTP((result) => {
        try {
          assert.equal(result, true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('Support HTTPS on port 443', (done) => {
      diagnostics.haveHTTPS((result) => {
        try {
          assert.equal(result, true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('Support IPv4', (done) => {
      diagnostics.haveIPv4Async((result) => {
        try {
          assert.equal(result, true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('Support IPv6', (done) => {
      diagnostics.haveIPv6Async((result) => {
        try {
          assert.equal(result, true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});
