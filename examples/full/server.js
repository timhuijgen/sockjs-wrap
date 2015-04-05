var
    express        = require('express'),
    http           = require('http'),
    Sockjs         = require('sockjs'),
    Connection     = require('sockjs-wrap/server');

var sockjs_options = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js"};

// Create the SockJS server and the Express App
var sockjs_echo = Sockjs.createServer(sockjs_options);
var App         = express();

// Create the Express server and give the server to SockJS
var Server = http.createServer(App);
sockjs_echo.installHandlers(Server, {prefix: '/socket'});

// Start listening
Server.listen(9876);

// Handle normal HTTP requests
App.post('/login', login);
App.post('/register', register);

// Start listening on socket connections
Connection.require_authentication = true;
Connection.start(sockjs_echo);


Connection.on('authenticate', function(data, callback){
    // Fetch your user from DB or memory on data.token
    // Create dummy user
    var user = {id: 1, token: "my_token"}

    // Check token
    console.log(data.token);
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


function login(req, res) {

}

function register(req, res) {

}