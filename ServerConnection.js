/**
 * Module Dependencies
 */

var EventEmitter = require('eventemitter3').EventEmitter;
var Util         = require('util');

/**
 *  Define if the connection needs to be authenticated by the client
 *  If this is not the case, the connection ID will be used instead
 *
 * @type {boolean}
 */

var require_authentication = true;

/**
 * @constructor
 */

function Connection() {
    this._connections = {};
    this._pending_connections = {};
    this._sockjs;

    this.on('connect', this.onConnect.bind(this));
    this.on('close', this.onClose.bind(this));
};

/**
 * Add event module
 */

Util.inherits(Connection, EventEmitter);

/**
 * Start the connection
 *
 * @param {SockJS} sockjs
 */

Connection.prototype.start = function (sockjs) {
    console.log('Connection :: Starting socket listeners');
    this._sockjs = sockjs;
    var self = this;

    // Sockjs Events
    sockjs.on('connection', function (client) {
        // Add to connections
        self._pending_connections[client.id] = client;
        self.emit('connect', client);

        // Handle connection close event
        client.on('close', function () {
            self.emit('close', client);
        });

        // Handle incoming data events
        client.on('data', function (data) {
            // Parse message
            try {
                var message = JSON.parse(data);
            } catch (e) {
                console.error("Connection :: Error :: Failed to parse JSON :: ", e);
                return;
            }

            // Check for type
            if (!message.hasOwnProperty('type')) {
                console.error("Connection :: Error :: No message type specified");
                return;
            }

            // If the connection is trying to authenticate add authentication function
            if ('authenticate' == message.type) {
                message.data.authenticate = function (user) {
                    return self.authenticate(client.id, user);
                };
            }
            // Else if the connection is not authenticated return an error
            else if (!client.hasOwnProperty('user_id')) {
                client.write(JSON.stringify({
                    type: message.type,
                    data: {type: 'error', message: 'Not authenticated', timestamp: message.data.timestamp}
                }));
                return;
            }
            // Or add the authenticated user_id to the message
            else {
                message.data.user_id = client.user_id;
            }

            // If the client has included a callback_id, prepare the callback function and emit
            if (message.hasOwnProperty('callback_id')) {
                var callback = function (data) {
                    client.write(JSON.stringify({type: 'callback', data: data, callback_id: message.callback_id}));
                };
                self.emit(message.type, message.data, callback);
            }
            // Emit and catch callbacks that shouldn't be called
            else {
                self.emit(message.type, message.data, function () {
                    console.error("Connection :: Warning :: Client did not specify callback function");
                });
            }

        });
    });

};

/**
 * Authenticate a given connection_id with a user
 *
 * The connection will be deleted from _pending_connections and added to _connections
 * And a user_id will be added to the connection object
 *
 * @param {mixed} connection_id
 * @param {object} user  |  Needs property id
 * @returns {boolean}
 */

Connection.prototype.authenticate = function (connection_id, user) {
    console.log('Connection :: Authenticate');
    if (this._pending_connections.hasOwnProperty(connection_id)) {
        this._connections[user.id] = this._pending_connections[connection_id];
        this._connections[user.id].user_id = user.id;
        delete this._pending_connections[connection_id];

        this.emit('authenticated', user);
        return true;
    } else {
        console.error("Connection :: Authenticate :: Failed to find the connection");
    }
    return false;
};

/**
 * If there is no authentication required, add the connection ID as user_id
 *
 * @param {object} client
 */

Connection.prototype.onConnect = function(client) {
    if (!require_authentication && !client.hasOwnProperty('user_id')) {
        client.user_id = client.id;
    }
}

/**
 * If the client disconnects, remove it from the connection list
 *
 * @param {object} client
 */

Connection.prototype.onClose = function(client) {
    if (client.hasOwnProperty('user_id')) {
        delete this._connections[client.user_id];
    } else {
        delete this._pending_connections[client.id];
    }
}

/**
 * Send data to a specific user
 *
 * @param {string} type
 * @param {object} data
 * @param {integer} id
 * @returns {boolean}
 */

Connection.prototype.send = function (type, data, id) {
    var _data = {type: type, data: data};

    if (this._connections.hasOwnProperty(id)) {
        this._connections[id].write(JSON.stringify(_data));
        return true;
    }
    return false;
};

/**
 * Send data to an array of IDs using the Connection.send function
 *
 * @param {string} type
 * @param {object} data
 * @param {array} IDs
 */

Connection.prototype.broadcastTo = function (type, data, list) {
    var self = this;
    for ( var ID in list ) {
        if(list.hasOwnProperty(ID)) {
            if (self._connections.hasOwnProperty(list[ID])) {
                console.log("sending to " + list[ID]);
                self.send(type, data, list[ID]);
            }
        }
    }
};

/**
 * Send data to all users using the Connection.send function
 *
 * @param {string} type
 * @param {object} data
 */

Connection.prototype.broadcast = function (type, data) {
    var self = this;
    for( var ID in self._connections ){
        if(self._connections.hasOwnProperty(ID)) {
            self.send(type, data, self._connections[ID]);
        }
    }
};

/**
 * Module Exports
 *
 * @type {Connection}
 */

module.exports = exports = new Connection();
