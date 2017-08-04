// Copyright 2017, Yahoo Holdings

// all GLOBALS are UPPERCASE    (... an experiment in js styling)
const
    ME = module.exports,
    LIBS = {
        http:   require('http'),
        https:  require('https'),
    },
    VERSION = require(__dirname + '/package.json').version;


function hookRequest(req) {
    req.httpHooks = {
        start: Date.now()
    };
}


function hookResponse(res) {
    var origWriteHead = res.writeHead;
    var origEnd = res.end;
    res.httpHooks = {};
    res.writeHead = function httpHooks_res_writeHead(status, reason, headers) {
        res.httpHooks.preWriteHead = Date.now();
        res.emit('httpHooks:pre:writeHead', status, reason, headers);
        origWriteHead.apply(res, arguments);
        res.httpHooks.postWriteHead = Date.now();
        res.emit('httpHooks:post:writeHead', status, reason, headers);
    };
    res.end = function httpHooks_res_end(chunk, encoding) {
        res.httpHooks.preEnd = Date.now();
        res.emit('httpHooks:pre:end', chunk, encoding);
        origEnd.apply(res, arguments);
        res.httpHooks.postEnd = Date.now();
        res.emit('httpHooks:post:end', chunk, encoding);
    };
}


function hookServer(proc, server) {
    var origEmit = server.emit;
    proc.emit('httpHooks:server', server);
    // If we use server.on('request', listener) then the handler of
    // http.createServer(handler) gets called before our listener.
    server.emit = function() {
        var name = arguments[0],
            req, res;
        if (name === 'connection') {
            proc.emit('httpHooks:connection', arguments[1]);
        }
        if (name === 'request') {
            req = arguments[1];
            res = arguments[2];
            ME.hookRequest(req);
            ME.hookResponse(res);
            proc.emit('httpHooks:request', req, res);
        }
        origEmit.apply(server, arguments);
    };
}


function hookProcess(proc) {
    proc.httpHooks = {
        version: VERSION
    };
    var httpCreateServer = LIBS.http.createServer;
    LIBS.http.createServer = function() {
        var server = httpCreateServer.apply(LIBS.http, arguments);
        ME.hookServer(proc, server);
        return server;
    };
    var httpsCreateServer = LIBS.https.createServer;
    LIBS.https.createServer = function() {
        var server = httpsCreateServer.apply(LIBS.https, arguments);
        ME.hookServer(proc, server);
        return server;
    };
}


/* istanbul ignore next: entrypoint */
if (!process.httpHooks) {
    hookProcess(process);
}


// mainly for testing
ME.LIBS = LIBS;
ME.hookRequest = hookRequest;
ME.hookResponse = hookResponse;
ME.hookServer = hookServer;
ME.hookProcess = hookProcess;
