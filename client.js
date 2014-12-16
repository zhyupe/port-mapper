var config = require('./lib/config');

var log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/client.log'), 'client');

var logger = log4js.getLogger('client');
logger.setLevel(config.LOG_LEVEL);
var retry = -1;

var connectClient = require('./lib/client/connectClient');

var connect = function () {
    new connectClient(logger, config.GATEWAY, config.CONNECT_PORT, config.CONNECT_SIGN,
        config.TRANS_PORT, config.SERVER_HOST, config.SERVER_PORT, function () {
            retry = 0;
        }, function () {
            if (retry >= 5) {
                logger.fatal('[connect] Reached limit of retries(5), Exit.');
            } else if (retry != -1) {
                setTimeout(function () {
                    retry++;
                    logger.info('[connect] Retrying. No.' + retry);
                    connect();
                }, 5000);
            } else {
                logger.fatal('[connect] Failed connecting to server, Exit.');
            }
        });
}

connect();