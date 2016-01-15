/**
 * Module Dependencies
 */

var EventEmitter = require('events').EventEmitter;
var Util         = require('util');
var _            = require('lodash');

/**
 * @constructor
 */

function Connection() {
    /**
     *  Define if the connection needs to be authenticated by the client
     *  If this is not the case, the connection ID will be used instead
     *
     * @type {boolean}
     */
    this.require_authentication = false;
    this.bundling = false;
    this.logging = function(){};

    this._connections = {};
    this._pending_connections = {};
    this._sockjs = null;


    this.on('connect', this.onConnect.bind(this));
    this.on('close', this.onClose.bind(this));
}

/**
 * Add event module
 */

Util.inherits(Connection, EventEmitter);

/**
 * Start the connection
 *
 * To reduce the amount of data being sent over the socket, the following abbreviations will be used
 * Message parameters:
 * b - bundle
 * t - type
 * d - data
 * c - callback_id
 *
 * @param {SockJS} sockjs
 * @param {object} options
 */

Connection.prototype.start = function (sockjs, options) {

    this._sockjs = sockjs;
    var self = this;

    // Parse options
    options                     =  options || {};
    this.require_authentication = (options.hasOwnProperty('authentication')) ? options.authentication : this.require_authentication;
    this.logging                = (options.hasOwnProperty('logging'))        ? options.logging        : this.logging;
    this.bundling               = (options.hasOwnProperty('bundling'))       ? options.bundling       : this.bundling;

    this.logging.call(null, 'Connection :: Starting socket listeners');

    // Sockjs Events
    sockjs.on('connection', function (client) {
        // Add to connections
        if(self.require_authentication) {
            self._pending_connections[client.id] = client;
        } else {
            self._connections[client.id] = client;
        }
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
                self.logging.call(null, "Connection :: Error :: Failed to parse JSON :: ", e);
                return;
            }

            // Check for type
            if (!message.hasOwnProperty('type')) {
                self.logging.call(null, "Connection :: Error :: No message type specified");
                return;
            }

            // If the connection is trying to authenticate add authentication function
            if ('authenticate' == message.t) {
                message.data.authenticate = function (user) {
                    return self.authenticate(client.id, user);
                };
                self.emit(message.t, message.d, function(data) {
                    client.write(JSON.stringify({
                        t: 'callback',
                        d: data,
                        c: message.c
                    }));
                });
                return;
            }
            // Else if the connection is not authenticated return an error
            if (!client.hasOwnProperty('user_id')) {
                client.write(JSON.stringify({
                    t: message.t,
                    d: {type: 'error', message: 'Not authenticated', timestamp: message.data.timestamp}
                }));
                return;
            }
            // Or add the authenticated user_id to the message
            else {
                message.d.user_id = client.user_id;
            }

            // If the client has included a callback_id, prepare the callback function and emit
            if (message.hasOwnProperty('c')) {
                var callback = message.c;
                if(!self.bundling) {
                    callback = function(data) {
                        client.write(JSON.stringify({
                            t: 'callback',
                            d: data,
                            c: message.c
                        }));
                    };
                }
                self.emit(message.t, message.d, callback);
            }
            // Emit and catch callbacks that shouldn't be called
            else {
                self.emit(message.t, message.d, function () {
                    self.logging.call(null, "Connection :: Warning :: Client did not specify callback function");
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
    this.logging.call(null, 'Connection :: Authenticate');
    if (this._pending_connections.hasOwnProperty(connection_id)) {
        var id = (user.hasOwnProperty('id')) ? user.id : user.get('id');
        this._connections[id] = this._pending_connections[connection_id];
        this._connections[id].user_id = id;
        delete this._pending_connections[connection_id];

        this.emit('authenticated', user);
        return true;
    } else {
        this.logging.call(null, "Connection :: Authenticate :: Failed to find the connection");
    }
    return false;
};

/**
 * If there is no authentication required, add the connection ID as user_id
 *
 * @param {object} client
 */

Connection.prototype.onConnect = function(client) {
    if (!this.require_authentication && !client.hasOwnProperty('user_id')) {
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
};


/**
 * Allow for bundled messages with multiple callback_ids
 *
 * Bundle: [{callback_id: <id>, type: <type>, data: <data>}]
 * Type is optional if you supply a callback_id,
 * callback_id is optional if you supply a type
 *
 * @param {Array} bundle
 * @param {int} id
 */
Connection.prototype.bundle = function(bundle, id) {
    this.send('b', bundle, id);
};

/**
 * Send data to a specific user
 *
 * @param {string} type
 * @param {object} data
 * @param {integer} id
 * @returns {boolean}
 */

Connection.prototype.send = function (type, data, id) {
    var _data = {t: type, d: data};

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
 * @param {array} list
 */

Connection.prototype.broadcastTo = function (type, data, list) {
    var self = this;
    _.forEach(list, function(id) {
        if (self._connections.hasOwnProperty(id)) {
            self.send(type, data, id);
        }
    });
};

/**
 * Send data to all users using the Connection.send function
 *
 * @param {string} type
 * @param {object} data
 */

Connection.prototype.broadcast = function (type, data) {
    var self = this;
    _.forEach(self._connections, function(id){
        self.send(type, data, id);
    });
};

/**
 * Module Exports
 *
 * @type {Connection}
 */

module.exports = exports = Connection;
