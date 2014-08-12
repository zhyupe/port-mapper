module.exports = function(callback) {
    var buf = null;
    return function(data) {
        var length = data.length;
        for (var i = length-1;i>=0;i--) {
            if (data[i] == 10) { // got \n
                var result;
                if (buf == null) {
                    result = data.slice(0, i);
                } else {
                    result = Buffer.concat([buf, data.slice(0, i)]);
                    buf = null;
                }

                callback(result.toString('ascii'));

                if (i != length - 1) {
                    buf = data.slice(i + 1);
                }
                return;
            }
        }

        if (buf == null) {
            buf = data;
        } else {
            buf = Buffer.concat([buf, data]);
        }
    }
}