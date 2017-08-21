// Copyright 2017, Yahoo Holdings
// Licensed under the terms of the 3-Clause BSD license. See LICENSE file in project root for terms.

/* global describe,before,it */
var assert = require('assert');
var http = require('http');
require('../index.js');


describe('http server functional tests', function() {
    var server,
        serverPort;

    before(function(done) {
        process.on('httpHooks:server', (s) => {
            server = s;
        });
        http.createServer((req, res) => {
            res.statusCode = 200;
            res.end('OK');
        }).listen(0, () => {
            serverPort = server.address().port;
            setTimeout(done, 10);
        });
    });

    it('has process stamp', function() {
        assert.equal(typeof process.httpHooks, 'object');
        assert.equal(typeof process.httpHooks.version, 'string');
    });

    it('emits process httpHooks:server', function() {
        assert(server instanceof http.Server);
        assert.equal(typeof serverPort, 'number');
    });

    describe('on a request', function() {
        var calls = {};
        before(function(done) {
            process.on('httpHooks:connection', (con) => {
                calls['proc on connection'] = con.remoteAddress;
            });
            process.on('httpHooks:request', (req, res) => {
                calls['proc on request'] = {req, res};
                res.on('httpHooks:pre:writeHead', (...args) => {
                    calls['res pre writeHead'] = args;
                });
                res.on('httpHooks:post:writeHead', (...args) => {
                    calls['res post writeHead'] = args;
                });
                res.on('httpHooks:pre:end', (...args) => {
                    calls['res pre end'] = args;
                });
                res.on('httpHooks:post:end', (...args) => {
                    calls['res post end'] = args;
                });
            });
            http.get('http://localhost:' + serverPort + '/', (res) => {
                var data = '';
                res.on('error', done);
                res.on('data', (chunk) => {
                    data += chunk.toString();
                });
                res.on('end', () => {
                    assert.equal(res.statusCode, 200);
                    assert.equal(data, 'OK');
                    done();
                });
                res.resume();
            });
        });

        it('emits process httpHooks:connection', function() {
            assert.equal(typeof calls['proc on connection'], 'string');
            // we don't know if IPv4 or IPv6
            assert(calls['proc on connection'].includes('127.0.0.1'));
        });

        it('emits process httpHooks:request', function() {
            assert.equal(typeof calls['proc on request'], 'object');
            var {req, res} = calls['proc on request'];
            assert.equal(typeof req.httpHooks, 'object');
            assert.equal(typeof req.httpHooks.start, 'number');
            assert.equal(typeof res.httpHooks, 'object');
            assert.equal(typeof res.httpHooks.preWriteHead, 'number');
            assert.equal(typeof res.httpHooks.postWriteHead, 'number');
            assert.equal(typeof res.httpHooks.preEnd, 'number');
            assert.equal(typeof res.httpHooks.postEnd, 'number');
        });

        it('emits res httpHooks:pre:writeHead', function() {
            assert.deepEqual(calls['res pre writeHead'], [
                200, undefined, undefined,
            ]);
        });

        it('emits res httpHooks:post:writeHead', function() {
            assert.deepEqual(calls['res post writeHead'], [
                200, undefined, undefined,
            ]);
        });

        it('emits res httpHooks:pre:end', function() {
            assert.deepEqual(calls['res pre end'], [
                'OK', undefined,
            ]);
        });

        it('emits res httpHooks:post:end', function() {
            assert.deepEqual(calls['res post end'], [
                'OK', undefined,
            ]);
        });
    });
});
