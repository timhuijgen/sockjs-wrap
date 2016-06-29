var should       = require( 'chai' ).should(),
    client       = require( './client' ),
    server       = require( './server' ),
    sockjsclient = require( 'sockjs-client' ),
    sockjsserver = require( 'sockjs' );

global.window = {
    location: {
        hostname: '127.0.0.1',
        protocol: 'http:'
    }
};


describe( 'See if the client is setup properly', function () {
    it( 'checks if the uninitialized client is a function', function () {
        client.should.be.a( 'function' );
    } );

    it( 'checks if the initialized client is created properly', function () {
        client = new client();
        client.should.be.an( 'object' );
        client.should.have.property( 'sockjs_path' );
        client.should.have.property( 'authenticated' );
    } );
} );

describe( 'Client functionality', function () {
    it( 'is should start the client and emit a close', function ( done ) {

        client.on( 'connect', function () {
            done();
        } );

        client.on( 'failure', function () {
            throw Error( 'Failure during startup' );
        } );

        client.on( 'close', function () {
            done();
        } );

        client.start( sockjsclient, {
            port: '5678'
        } );
    } );
} );

describe( 'See if the server is setup properly', function () {
    it( 'checks if the uninitialised server is a function', function () {
        server.should.be.a( 'function' );
    } );
    it( 'checks if the initialised server is an object', function () {
        server = new server();
        server.should.be.an( 'object' );
    } );
} );

describe( 'Server functionality', function () {
    it( 'should start the server', function() {
        var sockjs_echo = sockjsserver.createServer({sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"});
        server.start(sockjs_echo, {authentication: true});
        server.require_authentication.should.be.true;
    } )
} );
