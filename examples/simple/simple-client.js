/**
 * Make sure to have the scripts in your DOM
 * 
 * <script src="path.to.sockjs.js"></script>
 * <script src="path.to.client.js"></script>
 *
 */

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