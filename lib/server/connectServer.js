var net = require('net');
var logger = null,
    connectSocket = require('./connectSocket');

var ConnectServer = function (sign) {
    this.connectSocket = null;
    this.publicSign = null;
    this.sign = sign;
    this.status = this.STATUS.noConnect;
};

var connectServer    = ConnectServer.prototype;
connectServer.STATUS = { noConnect: 0, available: 2 };

/**
 * Send message to the back server.
 * @param type Message type.
 * @param msg (optional) Message to be sent.
 * @returns {boolean}
 *  TRUE if message is sent (but we don't promise it was received by client)
 *  FALSE if no client is unavailable, or message is not allowed.
 */
connectServer.send    = function (type, msg) {
    if (this.status != this.STATUS.available) {
        logger.debug('[connectServer.send][f] Client is unavailable');
        return false;
    }

    this.connectSocket.send(type, msg);
};

/**
 * net.createServer handler for connectServer
 */
connectServer.getHandler = function () {
    var self = this;
    return function (sock) {
        sock.id = sock.remoteAddress + ':' + sock.remotePort;
        logger.info('[connectServer.handler][' + sock.id + '] Connected.');

        new connectSocket(logger, self.sign, sock, function (_sock) {
            if (self.status == self.STATUS.available) {
                self.connectSocket.end();
            }

            self.connectSocket = _sock;
            self.status = self.STATUS.available;

            logger.info('[connectServer.handler][' + _sock.id + '] Switched.');
        }, function (_sock) {
            if (self.status == self.STATUS.available && self.connectSocket.id == _sock.id) {
                self.connectSocket = null;
                self.status = self.STATUS.noConnect;
            }

            logger.info('[connectServer.handler][' + _sock.id + '] Closed.');
        });
    }
};

module.exports = function (_logger, connectPort, connectSign) {
    logger = _logger;

    var _connectServer = new ConnectServer(connectSign);
    net.createServer(_connectServer.getHandler()).listen(connectPort, function() {
        logger.info('[connectServer] Listening ' + connectPort);
    });

    return _connectServer;
}