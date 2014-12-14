var tcp_helper = require('../tcp_helper');
var logger = null;

var ConnectSocket = function (_logger, sign, sock, connectCallback, endCallback) {
    logger = _logger;

    this.id = sock.id;
    this.sock = sock;
    this.authed = false;
    this.sign = sign;

    this.timer = null;

    var self = this;
    var ping = function() {
        self.sock.write('PING\n');
        self.timer = setTimeout(function() {
            logger.warn('[connectSocket.ping][' + self.sock.id + '] Ping timeout. Disconnect. ');

            self.timer = null;
            self.sock.end();
        }, 5000);
    };

    this.sock.on('error', function (err) {
        logger.error('[connectSocket.onError][' + self.id + '] ' + err.toString());

        try {
            self.end();
        } catch (e) {
            logger.error('[connectSocket.onError][' + sock.id + '] ' + e.toString());
        } finally {
            endCallback();
        }
    });

    this.sock.on('data', tcp_helper(function(data) {
        if (self.authed) {
            if (data == 'PONG') {
                logger.trace('[connectSocket.ping][' + self.sock.id + '] Received pong.');
                if (self.timer !== null) {
                    clearTimeout(self.timer);
                    self.timer = setTimeout(ping, 30000);
                }
            } else {
                logger.info('[connectSocket.remoteLog][' + self.sock.id + '] ' + data);
            }
        } else if (data != 'AUTH#' + self.sign) {
            logger.trace('[connectSocket.onData][' + self.sock.id + '] Access Denied.');
            self.sock.end();
        } else {
            self.authed = true;
            self.sock.write('CONNECTED\n');

            logger.info('[connectSocket.onData][' + self.sock.id + '] Authorized.');
            connectCallback(self.sock);

            self.timer = setTimeout(ping, 30000);
        }
    }));

    this.sock.on('close', function() {
        if (self.timer !== null) {
            clearTimeout(self.timer);
        }

        logger.info('[connectSocket.onClose][' + self.sock.id + '] Closed.');
        endCallback(self.sock);
    });
};

var connectSocket = ConnectSocket.prototype;
connectSocket.write = function (arg) {
    this.sock.write(arg);
};

connectSocket.end = function () {
    this.sock.end();
};

/**
 * Connect server socket handler.
 * @param logger Server logger.
 * @param sign Server key (for authorization)
 * @param sock Client socket
 * @param connectCallback Callback function if client is authorized.
 * @param endCallback Callback function if client socket is closed.
 * @constructor
 */
module.exports = ConnectSocket;