var net = require('net');
var tcp_helper = require('./tcp_helper');
var config = require('./config.json');


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
        console.error('PUBLIC_PORT', err);
        closed = true;

        try {
            sock.end();
        }
        catch (e) {
            console.error('TRANS_PORT', err);
        }
    });

    sock.on('close', function(data) {
        closed = true;
        console.log('[PUBLIC_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);

        if (cb !== null) cb();
    });
}).listen(config.PUBLIC_PORT, function() {
    console.log('[PUBLIC_PORT] Listening ' + config.PUBLIC_PORT);
});

net.createServer(function(sock) {
    console.log('[CONNECT_PORT] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    var authed = false, ping = function () {
        console.log('[CONNECT_PORT] Sending PING Packet')
        sock.write('PING\n');
        timer = setTimeout(function() {
            timer = null;
            sock.end();
        }, 5000)
    }, timer = null;
    sock.on('data', tcp_helper(function(data) {
        if (authed) {
            console.log('[CONNECT_PORT] In: ' + data);
            if (data == 'PONG') {
                if (timer !== null) {
                    clearTimeout(timer);
                    timer = setTimeout(ping, 30000);
                }
            }
        } else if (data != 'AUTH#' + config.CONNECT_SIGN) {
            console.log('[CONNECT_PORT] Access Denied');
            sock.end();
        } else {
            authed = true;

            if (BACK_SERVER !== null) {
                BACK_SERVER.end();
                BACK_SERVER = sock;
                BACK_STATUS = STATUS.available;
            } else {
                BACK_SERVER = sock;
                BACK_STATUS = STATUS.available;
            }

            sock.write('CONNECTED\n');

            timer = setTimeout(ping, 30000);
        }
    }));

    sock.on('error', function (err) {
        console.error('CONNECT_PORT', err);
        try {
            BACK_SERVER.end();
        }
        catch (e) {
            console.error('CONNECT_PORT', err);
        }
        finally {
            BACK_SERVER = null;
            BACK_STATUS = STATUS.noConnect;
        }
    });

    sock.on('close', function(data) {
        if (timer !== null) {
            clearTimeout(timer);
        }

        console.log('[CONNECT_PORT] CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);

        if (BACK_STATUS == STATUS.available) {
            BACK_SERVER = null;
            BACK_STATUS = STATUS.noConnect;
        }
    });
}).listen(config.CONNECT_PORT, function() {
    console.log('[CONNECT_PORT] Listening ' + config.CONNECT_PORT);
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
                console.error('TRANS_PORT', err);

                try {
                    sock.end();
                }
                catch (e) {
                    console.error('TRANS_PORT', err);
                }
            });

            client.pipe(sock);
            sock.pipe(client);

            piped = true;
        }
    }
}).listen(config.TRANS_PORT, function() {
    console.log('[TRANS_PORT] Listening ' + config.TRANS_PORT);
});