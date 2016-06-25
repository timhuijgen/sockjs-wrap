/**
 * Make sure to have the scripts in your DOM
 * 
 * <script src="path.to.sockjs.js"></script>
 * <script src="path.to.client.js"></script>
 *
 */

var MyConnection = new window.Connection();

MyConnection.on('connect', function(){

    MyConnection.send('some_event_or_something_else', {data: "Hello there"}, function(data){
        console.log("The server called our callback: ", data);
    });
});

MyConnection.start({
    port: 9876,
    sockjs_path: '/echo'
});