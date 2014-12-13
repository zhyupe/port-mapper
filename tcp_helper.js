module.exports = function(callback) {
    var buf = null;
    return function(data) {
        var length = data.length;

        var pos = 0;
        for (var i = 0; i < length; i++) {
            if (data[i] == 10) { // got \n
                var result;
                if (buf == null) {
                    result = data.slice(pos, i);
                } else {
                    result = Buffer.concat([buf, data.slice(pos, i)]);
                    buf = null;
                }
                callback(result.toString('ascii'));
                pos = i+1;
            }
        }

        if (pos != length) {
            if (buf == null) {
                buf = data.slice(pos);
            } else {
                buf = Buffer.concat([buf, data.slice(pos)]);
            }
        }
    }
}
