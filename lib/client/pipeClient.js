var net = require('net');
var logger = null;

var PipeClient = function (_logger, host, port, connectCallback) {
    logger = _logger;
    this.id = host + ':' + port;

    var self = this;
    this.status = this.STATUS.closed;

    this.pipedSock = null;

    this.client = new net.Socket();
    this.client.on('error', function (err) {
        logger.error('[pipeClient.onError][' + self.id + '] ' + err.toString());
        try {
            self.client.end();
        } catch (e) {
            logger.error('[pipeClient.onError][' + self.id + '] ' + e.toString());
        }
    });

    this.client.on('close', function(data) {
        if (self.status == self.STATUS.piped && self.pipedSock.status == self.STATUS.piped) {
            self.status = self.STATUS.closed;
            self.pipedSock.end();
        } else {
            self.status = self.STATUS.closed;
        }

        logger.info('[pipeClient.onClose][' + self.id + '] Closed.');
    });

    this.client.connect(port, host, function () {
        logger.info('[pipeClient][' + self.id + '] Connected.');
        self.status = self.STATUS.ready;
        connectCallback();
    });
};

var pipeClient = PipeClient.prototype;
pipeClient.STATUS = { closed: 0, ready: 1, piped: 2 };

pipeClient.end = function () {
    this.client.end();
};

pipeClient.pipe = function (_pipeClient) {
    this.client.pipe(_pipeClient.client);
    this.pipedSock = _pipeClient;
};

module.exports = PipeClient;