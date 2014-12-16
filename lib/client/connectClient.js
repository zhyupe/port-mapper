var net = require('net');
var tcp_helper = require('../tcp_helper');
var pipeClient = require('./pipeClient');
var logger = null;

var ConnectClient = function (_logger, gateway, connectPort, connectSign,
              transPort, serverHost, serverPort, connectCallback, endCallback) {
    logger = _logger;
    var self = this;

    this.id = gateway + ':' + connectPort;
    this.client = new net.Socket();
    this.client.on('error', function (err) {
        logger.error('[connectClient.onError][' + self.id + '] ' + err.toString());
        try {
            self.client.end();
        } catch (e) {
            logger.error('[connectClient.onError][' + self.id + '] ' + e.toString());
        }
    });
    this.client.on('close', function () {
        logger.info('[connectClient][' + self.id + '] Closed.');
        endCallback();
    });
    this.client.on('data', tcp_helper(function(data) {
        if (data == 'CONNECTED') {
            logger.info('[connectClient.onData][' + self.id + '] Authorized.');
            connectCallback();
        } else if (data == 'PING') {
            logger.trace('[connectClient.ping][' + self.id + '] Received ping.');
            self.send('PONG');
        } else {
            var pos = data.indexOf('#');
            if (pos == -1) {
                logger.debug('[connectClient.onData] ' + data)
            } else {
                var type = data.substr(0, pos);
                var msg = data.substr(pos + 1);

                if (type == 'NEW') {
                    logger.info('[connectClient.newClient] [' + msg + ']');
                    var gatewayClient = null,
                        localClient = null,
                        pipeCallback = function () {
                            if (gatewayClient !== null && localClient !== null &&
                                gatewayClient.status == gatewayClient.STATUS.ready &&
                                localClient.status == localClient.STATUS.ready) {
                                gatewayClient.pipe(localClient);
                                localClient.pipe(gatewayClient);
                                logger.debug('[connectClient.pipe] Piped [' +
                                gatewayClient.id + '] and [' + localClient.id + ']');
                            }
                        };
                    gatewayClient = new pipeClient(logger, gateway, transPort, pipeCallback);
                    localClient = new pipeClient(logger, serverHost, serverPort, pipeCallback);
                } else if (type == 'MSG') {
                    logger.info('[remote]' + msg);
                }
            }
        }
    }));

    this.client.connect(connectPort, gateway, function () {
        logger.info('[connectClient][' + self.id + '] Connected.');
        self.send('AUTH', connectSign);
    });
};

var connectClient = ConnectClient.prototype;
connectClient.send = function (type, msg) {
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
            logger.warn('[connectClient.send][f] Unknown type: ' + typeof msg);
            return false;
    }

    this.client.write(msg + '\n');
    logger.trace('[connectClient.send][t] ' + msg);
    return true;
};

module.exports = ConnectClient;