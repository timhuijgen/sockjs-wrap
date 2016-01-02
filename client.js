
/**
 * @constructor
 */

var Connection = function () {
    this.sockjs_path = '/socket';
    this.authenticated = false;

    this._sockjs = null;
    this._callbacks = {};
    this._pointer = 1;
    this._events = {};
};

/**
 * Start the Connection and add the listeners
 *
 * @param {object} options
 */

Connection.prototype.start = function (options) {
    // Setup basic options
    options             = options             || {};
    options.url         = options.url         || window.location.hostname;
    options.sockjs_path = options.sockjs_path || this.sockjs_path;
    options.logging     = options.logging     || function(){};

    // Check if SockJS is loaded
    if( 'function' !== typeof SockJS ) {
        options.logging.call(null, 'Connection :: error :: SockJS is undefined');
        this.emit('failure');
        return;
    }

    // Check for URL and port
    if(!options.hasOwnProperty('port') || !options.hasOwnProperty('url')) {
        options.logging.call(null, 'Connection :: error :: URL or Port not defined');
        return;
    }

    // Add http:// || https:// if its not already there
    if( 'http' != options.url.substr(0, 4) ) {
        var protocol = window.location.protocol + '//' || 'http://';
        options.url = protocol + options.url;
    }

    // Start socket connection with SockJS
    options.logging.call(null, 'Connection :: Starting socket interface on: ' + options.url + ':' + options.port + options.sockjs_path);
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
            options.logging.call(null, "Connection :: Error parsing message: ", error);
            return;
        }

        // Check for type
        if (!message.hasOwnProperty('type')) {
            options.logging.call(null, "Connection :: Invalid message: no type specified :: ", message);
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
 * Disconnect the connection
 */
Connection.prototype.disconnect = function() {
    if(this._sockjs._transport && this._sockjs._transport.ws)
        this._sockjs._transport.ws.onclose();
};

/**
 * Event system
 * @param {string} event
 * @param {function} cb
 */

Connection.prototype.on = function(event, cb) {
    if( ! this._events.hasOwnProperty(event) ) {
        this._events[event] = [];
    }
    this._events[event].push(cb);
};

/**
 * Event system
 * @param event
 */
Connection.prototype.emit = function(event) {
    var args = Array.prototype.slice.call(arguments).slice(1);

    if( this._events.hasOwnProperty(event) ) {
        var events = this._events[event];
        for ( var key in events ) {
            events[key].apply(null, args);
        }
    }
};