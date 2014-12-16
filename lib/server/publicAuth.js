var authClients = [];
var url = require('url');
var http = require('http');

var connectServer = null;
var page = function (msg) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>port-mapper Auth Page</title><style type="text/css">body{background:#fdf5e6;color:#444}body,input,button{font:14px/1.5 "Century Gothic","Trebuchet MS","Segoe UI","Georgia","Microsoft Yahei","SimHei",sans-serif}header,main,footer{max-width:600px;margin:20px auto}header{text-align:center;font-size:2em}footer{text-align:center}main{background:#fff;padding:20px;border-radius:10px}p{margin:10px 0}a{color:#bb6528}form div{margin:5px 0}label{width:100px;display:inline-block}input{padding:5px 10px;border:1px solid #CCC;border-radius:4px;box-sizing:border-box;width:240px}button{background:#bb6528;padding:5px 10px;border:0;margin:10px 0 10px 100px;color:#fff}.notice{margin:5px;padding:10px 20px;border-left:5px solid #bb6528;background:#fffefa}@media(max-width:320px){header,main,footer{margin:10px auto}main{padding:10px 5px}label{display:block;height:30px}}</style></head><body><header>port-mapper Auth Page</header><main>' + msg + '</main><footer><a href="https://github.com/zhyupe/port-mapper">port-mapper by Zhyupe</a> / <a href="/">English</a> / <a href="/?lang=zh_CHS">简体中文</a></footer></body></html>'
};
var html = {
    index: {
        en: '<div class="notice"><p>The <i>Auth code</i> can be acquired from the server owner.</p><p>The <i>Times</i> field defines the number of sockets allowed to establish in total. Set Times to 0 if you want it to be unlimited.</p><p>Please notice that the permission is given to your <b>public ip address (%i)</b>, be careful if you are in LAN.<br>The permission is valid <b>within 30 minutes</b>.</p></div><form action="/check" method="get"><div><label>Auth code</label><input id="code" name="code" type="text"></div><div><label>Times</label><input id="time" name="time" type="text" value="1"></div><button>Submit</button></form>',
        zh_CHS: '<div class="notice"><p><i>授权码</i> 可以从服务器所有者处获取</p><p><i>授权次数</i> 指定授权的连接次数。无限制请输入 0。</p><p>请注意，权限将被授予您的 <b>公网 IP 地址 (%i)</b>。如果您正在使用局域网，请小心他人冒用。<br>授权在 <b>30 分钟内</b> 有效。</p></div><form action="/check?lang=zh_CHS" method="get"><div><label>授权码</label><input id="code" name="code" type="text"></div><div><label>授权次数</label><input id="time" name="time" type="text" value="1"></div><button>提交</button></form>'
    },
    check_forbidden: {
        en: '<div class="notice"><p>Sorry, but your Auth code seems invalid.</p></div><form action="/" method="get"><button>Try again</button></form>',
        zh_CHS: '<div class="notice"><p>抱歉，您的授权码无效</p></div><form action="/?lang=zh_CHS" method="get"><button>重试</button></form>'
    },
    check_pass: {
        en: '<div class="notice"><p>Succeed! </p></div>',
        zh_CHS: '<div class="notice"><p>授权成功！</p></div>'
    }
};

var server = http.createServer(function(req, res) {
    if (req.method != 'GET') {
        res.writeHead(405, 'Method Not Allowed');
        res.write('Sorry, but the auth server only allows GET requests.');
        res.end();
        return;
    }

    var reqUrl = url.parse(req.url, true);
    var lang = reqUrl.query.lang == 'zh_CHS' ? 'zh_CHS' : 'en';
    switch (reqUrl.pathname) {
        case '/':
            res.write(page(html.index[lang].replace('%i', req.connection.remoteAddress)));
            res.end();
            break;
        case '/check':
            if (!!reqUrl.query.code && connectServer.checkSign(reqUrl.query.code)) {
                var count = parseInt(reqUrl.query.time);
                if (isNaN(count) || count < 0) count = 1;
                authClients.push({ip: req.connection.remoteAddress, time: Date.now() + 1800000, count: count})
                res.write(page(html.check_pass[lang]));
            } else {
                res.writeHead(403, 'Forbidden');
                res.write(page(html.check_forbidden[lang]));
            }
            res.end();
            break;
        default:
            res.writeHead(302, 'Found', { location: '/' });
            res.end();
            break;
    }
});
server.timeout = 5000;

module.exports.check = function (ip) {
    var time = Date.now();
    for (var i=0;i<authClients.length;i++) {
        if (authClients[i].time < time) {
            authClients.splice(i, 1);
            continue;
        }

        if (authClients[i].ip == ip) {
            if (authClients[i].count != 0) {
                authClients[i].count--;
                if (authClients[i].count == 0)
                    authClients.splice(i, 1);
            }

            return true;
        }
    }

    return false;
};

module.exports.setConnectServer = function (_connectServer) {
    connectServer = _connectServer;
};

module.exports.handle = function (sock) {
    http._connectionListener.call(server, sock);
};
