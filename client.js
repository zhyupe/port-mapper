var net = require('net');
var tcp_helper = require('./lib/tcp_helper');
var config = require('./config.json');

var retry = 0;
var connect = function () {
    var connectClient = new net.Socket();
    connectClient.connect(config.CONNECT_PORT, config.GATEWAY, function() {
        console.log('[CONNECT_CLIENT] CONNECTED TO: ' + config.GATEWAY + ':' + config.CONNECT_PORT);

        var connected = false;
        connectClient.on('data', tcp_helper(function(data) {
            if (data == 'CONNECTED') {
                connected = true;
                retry = 0;
            } else if (data == 'PING') {
                connectClient.write('PONG\n');
            } else {
                data = data.split('#');
                if (data[0] != 'NEW') return;

                var status = [false, false, false];
                var localClient = new net.Socket();
                var gatewayClient = new net.Socket();
                var doPipe = function () {
                    if (!status[2] && status[0] && status[1]) {
                        status[2] = true;
                        localClient.pipe(gatewayClient);
                        gatewayClient.pipe(localClient);
                    }
                }

                localClient.connect(config.SERVER_PORT, config.SERVER_HOST, function() {
                    console.log('[LOCAL_CLIENT] CONNECTED ' + data[1]);
                    status[0] = true;
                    doPipe();
					localClient.on('error', function (err) {
						console.error(err);
						try {
							localClient.end();
						}
						catch (e) {
							console.error(e);
						}
					});
                    localClient.on('close', function () {
                        console.log('[LOCAL_CLIENT] CLOSED ' + data[1]);
                        status[0] = false;
                        if (status[1]) gatewayClient.end();
                    })
                });
                gatewayClient.connect(config.TRANS_PORT, config.GATEWAY, function() {
                    console.log('[TRANS_CLIENT] CONNECTED ' + data[1]);
                    status[1] = true;
                    doPipe();
					gatewayClient.on('error', function (err) {
						console.error(err);
						try {
							gatewayClient.end();
						}
						catch (e) {
							console.error(e);
						}
					});
                    gatewayClient.on('close', function () {
                        console.log('[TRANS_CLIENT] CLOSED ' + data[1]);
                        status[1] = false;
                        if (status[0]) localClient.end();
                    })
                });
            }
        }));
        connectClient.on('error', function (err) {
            console.error(err);
            try {
                connectClient.end();
            }
            catch (e) {
                console.error(e);
            }
        });
        connectClient.on('close', function() {
            console.log('[CONNECT_CLIENT] CLOSED');
            if (!connected) return;
            if (retry >= 5) {
                console.error('Too many retries. Abort.');
            } else {
                setTimeout(function () {
                    retry++;
                    console.log('[CONNECT_CLIENT] Retrying. No.' + retry);
                    connect();
                }, 5000);
            }
        })
        connectClient.write('AUTH#' + config.CONNECT_SIGN + '\n');
    });
}

connect();