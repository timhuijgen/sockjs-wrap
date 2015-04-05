/**
 * Module Dependencies
 */

var EventEmitter = require('eventemitter3').EventEmitter;
var Util         = require('util');


/**
 * @constructor
 */

var Connection = function () {
    this.sockjs_path = '/socket';
    this.authenticated = false;

    this._sockjs = null;
    this._callbacks = {};
    this._pointer = 1;
};

/**
 * Add event module
 */

Util.inherits(Connection, EventEmitter);

/**
 * Start the Connection and add the listeners
 *
 * @param {object} options
 */

Connection.prototype.start = function (options) {
    // Check if SockJS is loaded
    if( 'function' !== typeof SockJS ) {
        console.log('Connection :: error :: SockJS is undefined');
        return;
    }

    // Setup basic options
    options             = options             || {};
    options.url         = options.url         || window.location.hostname;
    options.sockjs_path = options.sockjs_path || this.sockjs_path;

    // Check for URL and port
    if(!options.hasOwnProperty('port') || !options.hasOwnProperty('url')) {
        console.log('Connection :: error :: URL or Port not defined');
        return;
    }

    // Add http:// || https:// if its not already there
    if( 'http' != options.url.substr(0, 4) ) {
        var protocol = window.location.protocol + '//' || 'http://';
        options.url = protocol + options.url;
    }

    // Start socket connection with SockJS
    console.log('Connection :: Starting socket interface on: ' + options.url + ':' + options.port + options.sockjs_path);
    this._sockjs = new SockJS(options.url + ':' + options.port + options.sockjs_path);
    var self = this;

    // Handle connection open event
    this._sockjs.onopen = function () {
        self.emit('connect');
    };

    // Handle connection closed event
    this._sockjs.onclose = function () {
        self.emit('close');
    };

    // Handle message events
    this._sockjs.onmessage = function (raw_message) {
        // Parse message
        try {
            var message = JSON.parse(raw_message.data);
        } catch (error) {
            console.log("Connection :: Error parsing message: ", error);
            return;
        }

        // Check for type
        if (!message.hasOwnProperty('type')) {
            console.log("Connection :: Invalid message: no type specified :: ", message);
            return;
        }

        // Check for callback
        if (message.hasOwnProperty('callback_id') && self._callbacks.hasOwnProperty(message.callback_id)) {
            self._callbacks[message.callback_id].call(null, message.data);
        }

        // Emit the message
        self.emit(message.type, message.data);

    };

};

/**
 * Send an authentication request to the server with a token.
 *
 * @param {mixed} token
 */

Connection.prototype.authenticate = function (token) {
    var self = this;
    this.send('authenticate', {token: token}, function (data) {
        if( data.result ) {
            self.authenticated = true;
        }
        self.emit('authenticated', data);
    });
};

/**
 * Send data to the server
 *
 * @param {string} type
 * @param {object} data
 * @param {function} callback
 */

Connection.prototype.send = function (type, data, callback) {
    var _data = {type: type, data: data};

    if (typeof(callback) === 'function') {
        this._callbacks[this._pointer] = callback;
        _data.callback_id = this._pointer;
        this._pointer += 1;
    }

    this._sockjs.send(JSON.stringify(_data));
};

/**
 * Module Exports
 *
 * @type {Connection}
 */

module.exports = exports = new Connection();