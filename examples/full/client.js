'use strict';

function log(a) {
    var node = document.createElement('span');
    node.innerHTML = a + '<br/>';
    document.getElementById('output').appendChild(node);
}

// Initialize - Can require / extend the Connection if using build tools

var MyConnection = new window.Connection();

MyConnection.on('connect', function () {
    // Normally you would want to do an http login request here to the server and get a token back on successful login.

    log('Client connected to the server');

    var my_client_token = "my_token";
    MyConnection.authenticate(my_client_token);

});

MyConnection.on('close', function() {
    log('Connection closed, could not connect to the server');
});

MyConnection.on('authenticated', function (data) {
    log('Connection authenticated with result: ' + JSON.stringify(data));


    if (!data.result) {
        // Failed to authenticate

        return;
    }

    log('Connection successfully authenticated !');
    // Start the rest of the application
});

log('Starting new Connection to http://127.0.0.1:9876' );
MyConnection.start({
    url: 'http://127.0.0.1', // defaults to window.location.hostname
    port: 9876, // Required
    sockjs_path: '/socket' // Defaults to /socket
});


