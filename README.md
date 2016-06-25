SockJs-Wrap
===========
A simple SockJS wrapper for Node.

    * Client callbacks and custom data events. 
    * Authentication of clients, and keeping track of them. 
    * Send, broadcast and broadcastTo functionality. 
    * The server and client are both made the Node way.
    * Using browser and server compatible Event module EventEmitter3


How to use
=========

To install `sockjs-wrap` run:

    npm install sockjs-wrap
    
    
Run the full example test:
``` npm test ```


Simple example
==============
A simple example taken from the [SockJS-node](https://github.com/sockjs/sockjs-node) page with the new wrapper instead of handeling events directly.

```javascript
var http = require('http');
var sockjs = require('sockjs');
// Require the wrapper
var Connection = new (require('sockjs-wrap'))();

var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js' });
var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9876, '0.0.0.0');

// Attach the sockjs server to the wrapper 
Connection.start(echo);

// Now you can listen to your own custom events
Connection.on('some_event_or_something_else', function(data, callback){
    console.log("Some data received : ", data);
	// And execute callbacks to the client
    callback({hello: "Hi"});
    // Send to all clients
    Connection.broadcast('some_event', {some: 'data'});
});
```
And the client
```javascript
// Require the client or make sure the client.js is in your html before this code runs
var  Connection  = new (require('sockjs-wrap/client'))();

// On successful connection
Connection.on('connect', function(){
    // Send any event you want, with an oject of data and an optional callback
    Connection.send('some_event_or_something_else', {data: "Hello there"}, function(data){
        console.log("The server called our callback: ", data);
    });
});

// Start the connection
// If the SockJS client is in your HTML before you start
Connection.start({
    port: 9876,
    sockjs_path: '/echo'
});

// Or if you require the SockJS client:
var SockJS = require('sockjs-client');
Connection.start(SockJS, {
    port: 9876,
    sockjs_path: '/echo'
});
```

Authentication example
======================
This is a simplified version of how the authentication process works. 

```javascript
... Start the http servers and everything else ...

// Default authentication is off, so turn it on
Connection.start(Sockjs_echo, {authentication: true});
Connection.on('authenticate', function(data, callback){
    // Fetch your user from DB or memory on data.token
    var user = SomeClass.findUserByToken(data.token); // Dummy function
    if(user){
        // The wrapper added an authentication function to the data object if the client wants to authenticate
        // the user object must contain an id property
        if(data.authenticate(user)) {
            callback({result: true});
        }
    }
});

// Connection fires authenticated event when successful
Connection.on('authenticated', function(user){
    // Do anything you want
});
```
And the Client
```javascript
Connection.on('connect', function () {
    var my_client_token = "g75184g15438g517g";
    Connection.authenticate(my_client_token);
});

Connection.on('authenticated', function (data) {
    // data will be the data given to the callback function on the server 
    // The user might have failed authentication here so be sure to check data for the result    
});
```
* [Simple example](https://github.com/timhuijgen/sockjs-wrap/tree/master/examples/simple)
* [Full example](https://github.com/timhuijgen/sockjs-wrap/tree/master/examples/full)

Any messages send to the server by the client while not authenticated successfully will get an error back.
If you want to use authentication you can call 
`
Connection.require_authentication = true;
`
before the connection is started, or give 
`
{authentication: true}
`
as a second parameter to the start function.

Predefined events (both client and server):
* connect
* close
* authenticate
* authenticated

