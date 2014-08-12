var net = require('net');
var tcp_helper = require('./tcp_helper');

var PUBLIC_PORT   = 80;
var CONNECT_SIGN  = '';
var CONNECT_PORT  = 1201;
var TRANS_PORT    = 1202;

var BACK_SERVER   = null;
var STATUS        = { noConnect: 0, waitingClose: 1, available: 2 };
var BACK_STATUS   = 0;

var clientQueue   = [];

net.createServer(function(sock) {
    console.log('[PUBLIC_PORT] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    if (BACK_STATUS != STATUS.available) {
        sock.end();
        return;
    }

    var closed = false, cb = null;
    clientQueue.push(function (callback) {
        if (closed) {
            return null;
        } else {
            cb = callback;
            return sock;
        }
    });

    BACK_SERVER.write('NEW#' + sock.remoteAddress + ' ' + sock.remotePort + '\n');

    sock.on('error', function (err) {
        console.error(err);
    });

    sock.on('close', function(data) {
        closed = true;
        console.log('[PUBLIC_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);

        if (cb !== null) cb();
    });
}).listen(PUBLIC_PORT, function() {
    console.log('[PUBLIC_PORT] Listening ' + PUBLIC_PORT);
});

net.createServer(function(sock) {
    console.log('[CONNECT_PORT] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    var authed = false;
    sock.on('data', tcp_helper(function(data) {
        if (authed) {
            console.log('[CONNECT_PORT] In: ' + data);
        } else if (data != 'AUTH#' + CONNECT_SIGN) {
            console.log('[CONNECT_PORT] Access Denied');
            sock.end();
        } else {
            authed = true;

            if (BACK_SERVER !== null) {
                BACK_STATUS = STATUS.waitingClose;
                BACK_SERVER.end();
                BACK_SERVER = sock;
                BACK_STATUS = STATUS.available;
            } else {
                BACK_SERVER = sock;
                BACK_STATUS = STATUS.available;
            }

            sock.write('CONNECTED\n');
        }
    }));

    sock.on('error', function (err) {
        console.error(err);
        try {
            BACK_SERVER.end();
        }
        catch (e) {
            console.error(err);
        }
        finally {
            BACK_SERVER = null;
            BACK_STATUS = STATUS.noConnect;
        }
    });

    sock.on('close', function(data) {
        console.log('[CONNECT_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);

        if (BACK_STATUS == STATUS.available) {
            BACK_SERVER = null;
            BACK_STATUS = STATUS.noConnect;
        }
    });
}).listen(CONNECT_PORT, function() {
    console.log('[CONNECT_PORT] Listening ' + CONNECT_PORT);
});

net.createServer(function(sock) {
    console.log('[TRANS_PORT] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    if (clientQueue.length == 0) {
        sock.end();
        console.log('[TRANS_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    } else {
        var piped = false;
        var client = clientQueue.shift()(function () {
            if (piped) {
                piped = false;
                sock.end();
                console.log('[TRANS_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
            }
        });

        if (client === null) {
            sock.end();
            console.log('[TRANS_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
        } else {
            sock.on('close', function(data) {
                console.log('[TRANS_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
                if (piped) {
                    piped = false;
                    client.end();
                }
            });

            sock.on('error', function (err) {
                console.error(err);
            });

            client.pipe(sock);
            sock.pipe(client);

            piped = true;
        }
    }
}).listen(TRANS_PORT, function() {
    console.log('[TRANS_PORT] Listening ' + TRANS_PORT);
});