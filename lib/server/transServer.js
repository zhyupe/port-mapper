var net = require('net');
var logger = null;

var TransServer = function (connectServer, publicServer) {
    this.connectServer = connectServer;
    this.publicServer  = publicServer;
};

var transServer = TransServer.prototype;
transServer.STATUS = { closed: 0, ready: 1, piped: 2 };

/**
 * net.createServer handler for transServer
 */
transServer.getHandler = function () {
    var self = this;
    return function (sock) {
        sock.id = sock.remoteAddress + ':' + sock.remotePort;
        logger.info('[transServer.handler][' + sock.id + '] Connected.');

        sock.STATUS = self.STATUS;
        sock.status = sock.STATUS.ready;

        sock.on('error', function (err) {
            logger.error('[transServer.onError][' + sock.id + '] ' + err.toString());

            try {
                sock.end();
            }
            catch (e) {
                logger.error('[transServer.onError][' + sock.id + '] ' + e.toString());
            }
        });

        sock.on('close', function(data) {
            if (sock.status == sock.STATUS.piped &&
                sock.pipedSock.status == sock.pipedSock.STATUS.piped) {
                sock.status = sock.STATUS.closed;
                sock.pipedSock.end();
            } else {
                sock.status = sock.STATUS.closed;
            }

            logger.info('[transServer.onClose][' + sock.id + '] Closed.');
        });

        self.publicServer.doPipe(sock);
    }
};

module.exports = function (_logger, transPort, connectServer, publicServer) {
    logger = _logger;
    var _transServer = new TransServer(connectServer, publicServer);
    net.createServer(_transServer.getHandler()).listen(transPort, function() {
        logger.info('[transServer] Listening ' + transPort);
    });

    return _transServer;
}