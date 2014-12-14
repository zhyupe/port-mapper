var config = require('./config.json');

var log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/server.log'), 'server');

var logger = log4js.getLogger('server');

var connectServer = require('./lib/server/connectServer')
        (logger, config.CONNECT_PORT, config.CONNECT_SIGN),
     publicServer = require('./lib/server/publicServer')
        (logger, config.PUBLIC_PORT,  connectServer),
      transServer = require('./lib/server/transServer')
        (logger, config.TRANS_PORT,   connectServer, publicServer);