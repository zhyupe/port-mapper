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
 1. 编辑 *config.json* 中的设置
 2. 上传文件到两台服务器
 3. 在程序目录下执行 ```npm install```
 4. 在 **公网服务器** 上运行 *server.js*
 5. 在 **中转计算机** 上运行 *client.js*

***[提示] 你必须先执行第三步，否则 client.js 无法正常运行***

##设置定义

设置应在 *config.json* 中进行配置。

请**不要**删除 *config.example.json*。此文件用于确保设置格式为最新版本，并保证程序正常运行。

```javascript
{
    "LOG_LEVEL"    : "INFO", // 被记录的日志的最低等级

    "GATEWAY"      : "",    // 公网服务器的 IP 或 域名

    "SERVER_HOST"  : "",    // 内网服务器的 IP 或 域名
    "SERVER_PORT"  : 80,    // 内网服务器的端口

    "CONNECT_SIGN" : "",    // 连接认证串，可以避免未经许可的访问
    "CONNECT_PORT" : 1201,  // 公网服务器通信端口
    "TRANS_PORT"   : 1202,  // 公网服务器传输端口
    "PUBLIC_PORT"  : 80     // 从公网访问的端口
}
```

## 贡献者
贡献者名单可以在 [这里][3] 查看

  [1]: PRINCIPLE.md
  [2]: README.md
  [3]: https://github.com/zhyupe/port-mapper/graphs/contributors
