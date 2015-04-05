var  Connection  = require('sockjs-wrap').client();

Connection.on('connect', function(){

    Connection.send('some_event_or_something_else', {data: "Hello there"}, function(data){
        console.log("The server called our callback: ", data);
    });
});

Connection.start({
    port: 9876,
    sockjs_path: '/echo'
});

window.Connection = Connection;