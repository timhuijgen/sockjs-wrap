var beefy  = require('beefy'),
    open   = require('open'),
    server = require('./examples/full/server.js'),
    http   = require('http');


console.log('Starting webserver with beefy');

http.createServer(beefy('./')).listen(9966);

console.log('Opening browser window: http://127.0.0.1:9966/examples/full/client.html');

open('http://127.0.0.1:9966/examples/full/client.html');


