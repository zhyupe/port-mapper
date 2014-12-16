var config = require('./lib/config');

var log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/server.log'), 'server');

var logger = log4js.getLogger('server');
logger.setLevel(config.LOG_LEVEL);

var connectServer = require('./lib/server/connectServer')
        (logger, config.CONNECT_PORT, config.CONNECT_SIGN, config.PUBLIC_AUTH),
     publicServer = require('./lib/server/publicServer')
        (logger, config.PUBLIC_PORT,  connectServer, config.PUBLIC_AUTH),
      transServer = require('./lib/server/transServer')
        (logger, config.TRANS_PORT,   connectServer, publicServer);