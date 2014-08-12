var net = require('net');
var tcp_helper = require('./tcp_helper');

var GATEWAY       = '';

var SERVER_HOST   = '';
var SERVER_PORT   = 80;

var CONNECT_SIGN  = '';
var CONNECT_PORT  = 1201;
var TRANS_PORT    = 1202;

var connectClient = new net.Socket();
connectClient.connect(CONNECT_PORT, GATEWAY, function() {
    console.log('[CONNECT_CLIENT] CONNECTED TO: ' + GATEWAY + ':' + CONNECT_PORT);

    var connected = false;
    connectClient.on('data', tcp_helper(function(data) {
        if (data == 'CONNECTED') {
            connected = true;
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

            localClient.connect(SERVER_PORT, SERVER_HOST, function() {
                console.log('[LOCAL_CLIENT] CONNECTED ' + data[1]);
                status[0] = true;
                doPipe();
                localClient.on('close', function () {
                    status[0] = false;
                    if (status[1]) gatewayClient.end();
                })
            });
            gatewayClient.connect(TRANS_PORT, GATEWAY, function() {
                status[1] = true;
                doPipe();
                gatewayClient.on('close', function () {
                    status[1] = false;
                    if (status[0]) localClient.end();
                })
            });
        }
    }));
    connectClient.write('AUTH#' + CONNECT_SIGN + '\n');
});
