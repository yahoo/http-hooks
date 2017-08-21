http-hooks
==========
Adds hooks to allow efficient access to points in the HTTP request and response lifecycle.


background
----------
Some libraries needs to hook into the http (and https) serving _beyond_ what can be
done by an express middleware.  Instead of having each of these monkey-patch node.js,
http-hooks provides a common set of hooks which these libraries can use.


adding to apps
--------------
Adding this to the app is as simple as `require('http-hooks')` in your server code.
Then you can add event listeners as described below.


example
-------
```javascript
require('http-hooks');    // just requiring it installs it

process.on('httpHooks:request', (req, res) => {
    res.on('httpHooks:pre:writeHead', () => {
        res.setHeader('X-Duration', (res.httpHooks.preWriteHead - req.httpHooks.start));
    });
})
```


process attribute 'httpHooks.version'
-------------------------------------

* `process.httpHooks.version` {String}

This is added to mark that the app is protected by http-hooks.


process event 'httpHooks:server'
---------------------------------

* `process.on('httpHooks:server', (server) => {...})`

This is emitted when a new http or https server object is created.


process event 'httpHooks:connection'
-------------------------------------

* `process.on('httpHooks:connection', (con) => {...})`

This is emitted for each incoming http or https connection.


process event 'httpHooks:request'
----------------------------------

* `process.on('httpHooks:request', (req, res) => {...})`

This is emitted for each incoming http or https request.


request attribute 'httpHooks.start'
-----------------------------------

* `req.httpHooks.start` {Number}

This is the time (number of milliseconds since unix epoch) of when the request started.


response attribute 'httpHooks.preWriteHead'
-------------------------------------------

* `res.httpHooks.preWriteHead` {Number}

This is the time (number of milliseconds since unix epoch) of just before `res.writeHead()` is called,
and before the `httpHooks:pre:writeHead` response event.


response attribute 'httpHooks.postWriteHead'
--------------------------------------------

* `res.httpHooks.postWriteHead` {Number}

This is the time (number of milliseconds since unix epoch) of just after `res.writeHead()` is called,
but before the `httpHooks:post:writeHead` response event.


response attribute 'httpHooks.preEnd'
-------------------------------------

* `res.httpHooks.preEnd` {Number}

This is the time (number of milliseconds since unix epoch) of just before `res.end()` is called,
and before the `httpHooks:pre:end` response event.


response attribute 'httpHooks.postEnd'
--------------------------------------

* `res.httpHooks.postEnd` {Number}

This is the time (number of milliseconds since unix epoch) of just after `res.end()` is called,
but before the `httpHooks:post:end` response event.


response event 'httpHooks:pre:writeHead'
-----------------------------------------

* `res.on('httpHooks:pre:writeHead', (status, reason, headers) => {...})`

This is emitted before the response's `writeHead()` is called.
This might be good time to modify outgoing headers using `res.setHeader()`.


response event 'httpHooks:post:writeHead'
------------------------------------------

* `res.on('httpHooks:post:writeHead', (status, reason, headers) => {...})`

This is emitted after the response's `writeHead()` is called.
This might be good time to monitor when the first bytes have been sent to the client.


response event 'httpHooks:pre:end'
-----------------------------------

* `res.on('httpHooks:pre:end', (chunk, encoding) => {...})`

This is emitted before the response's `end()` is called.
Before emitting this event http-hooks will add a `res.httpHooks.preEnd` field.
This might be a good time to monitor the time it took to generate the page.

**Note:** Since http-hooks is often loaded early, other libraries which monkey-patch
`res.end()` will run after http-hooks.


response event 'httpHooks:post:end'
------------------------------------

* `res.on('httpHooks:post:end', (chunk, encoding) => {...})`

This is emitted before the response's `end()` is called.
Before emitting this event http-hooks will add a `res.httpHooks.postEnd` field.
This might be a good time to monitor the time it took to send the response.

**Note:** Since http-hooks is often loaded early, other libraries which monkey-patch
`res.end()` will run after http-hooks.


