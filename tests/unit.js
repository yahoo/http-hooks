/* global describe,beforeEach,it */
var assert = require('assert');
var events = require('events');
var testee;


describe('index.js', function() {
    beforeEach(function() {
        // reload fresh (un-monkey-patched) version
        require.cache[require.resolve('../index.js')] = undefined;
        testee = require('../index.js');
    });


    describe('hookRequest()', function() {
        it('adds the object', function() {
            var req = {};
            testee.hookRequest(req);
            assert.equal(typeof req.httpHooks, 'object');
            assert.equal(typeof req.httpHooks.start, 'number');
        });
    });


    describe('hookResponse()', function() {
        it('wraps writeHead()', function() {
            var res = new events.EventEmitter(),
                calls = [];
            res.writeHead = (...args) => {
                calls.push(['orig writeHead', ...args]);
            };
            testee.hookResponse(res);
            res.on('httpHooks:pre:writeHead', (...args) => {
                calls.push(['pre writeHead', ...args]);
            });
            res.on('httpHooks:post:writeHead', (...args) => {
                calls.push(['post writeHead', ...args]);
            });
            res.writeHead('red', 'orange', 'yellow');
            assert.equal(typeof res.httpHooks, 'object');
            assert.equal(typeof res.httpHooks.preWriteHead, 'number');
            assert.equal(typeof res.httpHooks.postWriteHead, 'number');
            assert.deepEqual(calls, [
                [ 'pre writeHead', 'red', 'orange', 'yellow' ],
                [ 'orig writeHead', 'red', 'orange', 'yellow' ],
                [ 'post writeHead', 'red', 'orange', 'yellow' ],
            ]);
        });

        it('wraps end()', function() {
            var res = new events.EventEmitter(),
                calls = [];
            res.end = (...args) => {
                calls.push(['orig end', ...args]);
            };
            testee.hookResponse(res);
            res.on('httpHooks:pre:end', (...args) => {
                calls.push(['pre end', ...args]);
            });
            res.on('httpHooks:post:end', (...args) => {
                calls.push(['post end', ...args]);
            });
            res.end('red', 'orange');
            assert.equal(typeof res.httpHooks, 'object');
            assert.equal(typeof res.httpHooks.preEnd, 'number');
            assert.equal(typeof res.httpHooks.postEnd, 'number');
            assert.deepEqual(calls, [
                [ 'pre end', 'red', 'orange' ],
                [ 'orig end', 'red', 'orange' ],
                [ 'post end', 'red', 'orange' ],
            ]);
        });
    });


    describe('hookServer()', function() {
        it('emits httpHooks:connection', function() {
            var proc = new events.EventEmitter(),
                server = new events.EventEmitter(),
                calls = [];
            proc.on('httpHooks:server', (...args) => {
                calls.push(['on proc server', ...args]);
            });
            proc.on('httpHooks:connection', (...args) => {
                calls.push(['on proc connection', ...args]);
            });
            testee.hookServer(proc, server);
            server.emit('connection', 'red');
            assert.deepEqual(calls, [
                ['on proc server', server],
                ['on proc connection', 'red'],
            ]);
        });

        it('emits httpHooks:request', function() {
            var proc = new events.EventEmitter(),
                server = new events.EventEmitter(),
                calls = [];
            proc.on('httpHooks:server', (...args) => {
                calls.push(['on proc server', ...args]);
            });
            proc.on('httpHooks:request', (...args) => {
                calls.push(['on proc request', ...args]);
            });
            testee.hookServer(proc, server);
            server.emit('request', 'red', 'orange');
            assert.deepEqual(calls, [
                ['on proc server', server],
                ['on proc request', 'red', 'orange'],
            ]);
        });
    });


    describe('hookProcess()', function() {
        it('adds the object', function() {
            var proc = new events.EventEmitter();
            testee.hookProcess(proc);
            assert.equal(typeof proc.httpHooks, 'object');
            assert.equal(typeof proc.httpHooks.version, 'string');
        });

        it('patches both createServer()s', function() {
            var proc = new events.EventEmitter(),
                httpServer = new events.EventEmitter(),
                httpsServer = new events.EventEmitter(),
                calls = [];
            proc.on('httpHooks:server', (...args) => {
                calls.push(['proc on server', ...args]);
            });
            testee.LIBS.http = {
                createServer(...args) {
                    calls.push(['http orig createServer', ...args]);
                    return httpServer;
                }
            };
            testee.LIBS.https = {
                createServer(...args) {
                    calls.push(['https orig createServer', ...args]);
                    return httpsServer;
                }
            };
            testee.hookProcess(proc);
            testee.LIBS.http.createServer('red');
            testee.LIBS.https.createServer('orange');
            assert.deepEqual(calls, [
                ['http orig createServer', 'red'],
                ['proc on server', httpServer],
                ['https orig createServer', 'orange'],
                ['proc on server', httpsServer],
            ]);
        });
    });
});
