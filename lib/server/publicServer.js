var net = require('net');
var logger = null;

var PublicServer = function (connectServer) {
    this.connectServer = connectServer;
    this.clientQueue   = [];
};

var publicServer    = PublicServer.prototype;
publicServer.STATUS = { closed: 0, ready: 1, piped: 2 };

/**
 * net.createServer handler for publicServer
 */
publicServer.getHandler = function () {
    var self = this;
    return function (sock) {
        sock.id = sock.remoteAddress + ':' + sock.remotePort;
        logger.info('[publicServer.handler][' + sock.id + '] Connected.');

        if (self.connectServer.status != self.connectServer.STATUS.available) {
            logger.warn('[publicServer.handler][' + sock.id + '] Connect server is unavailable.');
            sock.end();
            return;
        }

        sock.STATUS = self.STATUS;
        sock.status = sock.STATUS.ready;

        sock.on('error', function (err) {
            logger.error('[publicServer.onError][' + sock.id + '] ' + err.toString());

            try {
                sock.end();
            }
            catch (e) {
                logger.error('[publicServer.onError][' + sock.id + '] ' + e.toString());
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

            logger.info('[publicServer.onClose][' + sock.id + '] Closed.');
        });

        self.clientQueue.push(sock);
        self.connectServer.send('NEW', sock.id);
    }
};

/**
 * Pipe a trans socket to a public socket.
 * @param transSock Trans socket
 */
publicServer.doPipe  = function (transSock) {
    if (this.clientQueue.length > 0) {
        var publicSock = this.clientQueue.shift();
        if (publicSock.status != publicSock.STATUS.ready) {
            this.doPipe(transSock);
            return;
        }

        publicSock.pipe(transSock); publicSock.pipedSock = transSock;
        transSock.pipe(publicSock); transSock.pipedSock = publicSock;
        logger.debug('[publicServer.doPipe][' + transSock.id + ':T] Piped [' + publicSock.id + ':P].');
    } else {
        logger.debug('[publicServer.doPipe][' + transSock.id + ':T] No client.');
        transSock.end();
    }
};

module.exports = function (_logger, publicPort, connectServer) {
    logger = _logger;

    var _publicServer = new PublicServer(connectServer);
    net.createServer(_publicServer.getHandler()).listen(publicPort, function() {
        logger.info('[publicServer] Listening ' + publicPort);
    });

    return _publicServer;
}