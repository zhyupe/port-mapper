var tcp_helper = require('../tcp_helper');
var logger = null;

var ConnectSocket = function (_logger, sign, publicAuth, sock, connectCallback, endCallback) {
    logger = _logger;

    this.id = sock.id;
    this.sock = sock;
    this.authed = false;
    this.sign = sign;

    this.publicAuth = publicAuth;
    this.publicSign = null;

    this.timer = null;

    var self = this;
    var ping = function() {
        self.send('PING');
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
            endCallback(self);
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
            self.send('CONNECTED');

            logger.info('[connectSocket.onData][' + self.sock.id + '] Authorized.');
            connectCallback(self);

            self.timer = setTimeout(ping, 30000);

            if (self.publicAuth !== false) {
                self.publicSign =
                    self.publicAuth === true ?
                        Math.random().toString().substr(2,10) :
                        self.publicAuth;

                self.send('MSG', '[public.auth] Auth code is ' + self.publicSign);
                logger.info('[public.auth] Auth code is ' + self.publicSign);
            }
        }
    }));

    this.sock.on('close', function() {
        if (self.timer !== null) {
            clearTimeout(self.timer);
        }

        logger.info('[connectSocket.onClose][' + self.sock.id + '] Closed.');
        endCallback(self);
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
 * Send message to the back server.
 * @param type Message type.
 * @param msg (optional) Message to be sent.
 * @returns {boolean}
 *  TRUE if message is sent (but we don't promise it was received by client)
 *  FALSE if no client is unavailable, or message is not allowed.
 */
connectSocket.send = function (type, msg) {
    switch (typeof msg) {
        case 'undefined':
            msg = type;
            break;
        case 'string':
            msg = type + '#' + msg;
            break;
        case 'number':
            msg = type + '#' + msg.toString();
            break;
        case 'object':
            msg = type + '#' + JSON.stringify(msg);
            break;
        default:
            logger.warn('[connectSocket.send][f] Unknown type: ' + typeof msg);
            return false;
    }

    this.sock.write(msg + '\n');
    logger.trace('[connectSocket.send][t] ' + msg);
    return true;
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