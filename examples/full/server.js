var
    http           = require('http'),
    Sockjs         = require('sockjs'),
    Connection     = new (require('sockjs-wrap'))();

var sockjs_options = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"};

// Create the SockJS server and the Express App
var sockjs_echo = Sockjs.createServer(sockjs_options);

// Create the Express server and give the server to SockJS
var Server = http.createServer();
sockjs_echo.installHandlers(Server, {prefix: '/socket'});

// Start listening
Server.listen(9876);

// Start listening on socket connections
Connection.start(sockjs_echo, {authentication: true});

Connection.on('authenticate', function(data, callback){
    // Fetch your user from DB or memory on data.token
    // Create dummy user
    var user = {id: 1, token: "my_token"}

    // Check token
    if(user.token == data.token){
        // The wrapper added an authentication function to the data object if the client wants to authenticate
        // the user object must contain an id property
        if(data.authenticate(user)) {
            callback({result: true});
            return;
        }
    }
    callback({result: false, message: 'Something went wrong and you are not authenticated'});
});

// Connection fires authenticated event when successful
Connection.on('authenticated', function(user){
    // Do anything you want
    console.log('Connection :: Authenticated user : ', user);
});