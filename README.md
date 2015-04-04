SockJs-Wrap
===========
A simple SockJS wrapper for Node. 
    * Client callbacks and custom data events. 
    * Authentication of clients, and keeping track of them. 
    * Send, broadcast and broadcastTo functionality. 
    * The server and client are both made the Node way.
    * Using browser and server compatible Event module EventEmitter3
In order to use the client you will have to compile it with [Browserify.](https://github.com/substack/node-browserify)

How to use
=========

To install `sockjs-wrap` run:

    npm install sockjs-wrap

The install will also browserify the examples.

Simple example
==============
A simple example taken from the [SockJS-node](https://github.com/sockjs/sockjs-node) page with the new wrapper instead of handeling events directly.

```javascript
var http = require('http');
var sockjs = require('sockjs');
// Require the wrapper and make sure to get the server() part
var Connection = require('sockjs-wrap').server();

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
// Make sure to get the client() part
var  Connection  = require('sockjs-wrap').client();

// On successful connection
Connection.on('connect', function(){
    // Send any event you want, with an oject of data and an optional callback
    Connection.send('some_event_or_something_else', {data: "Hello there"}, function(data){
        console.log("The server called our callback: ", data);
    });
});

// The SockJS client must be included in your HTML before you start
// Start the connection
Connection.start({
    port: 9876,
    sockjs_path: '/echo'
});
```

Authentication example
======================
This is a simplified version of how the authentication process works. Full example in the examples folder.
```javascript
... Start the servers and everything else ...

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
Any messages send to the server by the client while not authenticated successfully will get an error back.
To disable the need for authentication you can call 
`
Connection.require_authentication = false;
`
before the connection is started on the server.

Predefined events (both client and server):
* connect
* close
* authenticate
* authenticated

