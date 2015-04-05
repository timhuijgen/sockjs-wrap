'use strict';

var
    Connection  = require('sockjs-wrap').client();

Connection.on('connect', function () {
    // Normally you would want to do an http login request here to the server and get a token back on successful login.
    var my_client_token = "my_token";
    Connection.authenticate(my_client_token);

});

Connection.on('authenticated', function (data) {
    console.log('Connection :: Authenticated :: ', data);

    if (!data.result) {
        // Failed to authenticate

        return;
    }

    console.log('Connection successfully authenticated !');
    // Start the rest of the application
});

Connection.start({
    url: 'http://127.0.0.1', // defaults to window.location.hostname
    port: 9876, // Required
    sockjs_path: '/socket' // Defaults to /socket
});


