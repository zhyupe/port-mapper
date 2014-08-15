端口转发器 (port-mapper)
========================

使用 node.js 编写的端口转发工具，可以借助一台拥有公网 IP 的服务器和一台内网中转计算机来通过公网访问内网服务器的服务。
在 Minecraft 1.7.2 服务器上测试通过。

此项目以 GPLv2 许可证发布。

[原理简介 (Simplified Chinese)][1]

###Other languages
* [English][2]

##系统需求

 * 一台拥有公网 IP 的服务器
 * 一台内网中转计算机（也可以直接使用要访问的服务器）
 * 在公网服务器和中转计算机上安装 node.js 运行时

##使用方法
 1. 编辑 *server.js* 和 *client.js* 中的设置
 2. 上传文件
 3. 在 **公网服务器** 上运行 *server.js*
 4. 在 **中转计算机** 上运行 *client.js*

***[提示] 你必须先执行第三步，否则 client.js 无法正常运行***

##设置定义
*[提示] 你需要保证 server.js 中的设置值与 client.js 中的一致*

### server.js
```javascript
var PUBLIC_PORT   = 80; // 从公网访问的端口
var CONNECT_SIGN  = ''; // 连接认证串，可以避免未经许可的访问
var CONNECT_PORT  = 1201; // 公网服务器通信端口
var TRANS_PORT    = 1202; // 公网服务器传输端口
```
### client.js
```javascript
var GATEWAY       = ''; // 公网服务器的 IP 或 域名

var SERVER_HOST   = ''; // 内网服务器的 IP 或 域名
var SERVER_PORT   = 80; // 公网服务器的端口

var CONNECT_SIGN  = ''; // 连接认证串，可以避免未经许可的访问
var CONNECT_PORT  = 1201; // 公网服务器通信端口
var TRANS_PORT    = 1202; // 公网服务器传输端口
```

  [1]: PRINCIPLE.md
  [2]: README.md
