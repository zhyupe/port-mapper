var defaultConfig = require('../config.example.json');
var userConfig = require('../config.json');

var extend = function () {
    var pos = 1, dest = arguments[0];
    for (; pos < arguments.length; pos++) {
        for (var k in arguments[pos]) {
            dest[k] = arguments[pos][k];
        }
    }

    return dest;
};

module.exports = extend(defaultConfig, userConfig);
