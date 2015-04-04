module.exports.client = function() {
    return require('./ClientConnection');
};

module.exports.server = function() {
    return require('./ServerConnection');
};