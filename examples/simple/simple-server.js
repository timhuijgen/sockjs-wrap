var http = require('http');
var sockjs = require('sockjs');
var Connection = require('sockjs-wrap').server();

var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js' });
var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9876, '0.0.0.0');

Connection.start(echo);


Connection.on('some_event_or_something_else', function(data, callback){
    console.log("Some data received : ", data);

    callback({hello: "Hi"});
});