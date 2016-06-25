'use strict';

// Initialize - Can require / extend the Connection if using build tools
var MyConnection = new window.Connection();

MyConnection.on('connect', function () {
    // Normally you would want to do an http login request here to the server and get a token back on successful login.
    var my_client_token = "my_token";
    MyConnection.authenticate(my_client_token);

});

MyConnection.on('authenticated', function (data) {
    console.log('MyConnection :: Authenticated :: ', data);

    if (!data.result) {
        // Failed to authenticate

        return;
    }

    console.log('MyConnection successfully authenticated !');
    // Start the rest of the application
});

MyConnection.start({
    url: 'http://127.0.0.1', // defaults to window.location.hostname
    port: 9876, // Required
    sockjs_path: '/socket' // Defaults to /socket
});


