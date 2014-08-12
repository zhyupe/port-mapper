初始化操作
=========

##server.js
server.js 启动后，监听 PUBLIC_PORT / CONNECT_PORT / TRANS_PORT 三个端口

### PUBLIC_PORT
用于开放公网端口访问

### CONNECT_PORT
用于接收中转服务器握手连接，并在 *PUBLIC_PORT* 收到请求时经过此连接通知中转服务器在传输端口建立新连接

### TRANS_PORT
用于接收中转服务器数据传输连接

##client.js
client.js 启动后，连接 *GATEWAY:CONNECT_PORT* 并请求认证

公网请求接受
============

*PUBLIC_PORT* 收到请求后，判断有无中转服务器连接（如无连接，直接中断连接）。
然后将请求存入队列并通知中转服务器建立新连接。

中转服务器收到通知后，分别连接 *SERVER_HOST:SERVER_PORT* 和 *GATEWAY:TRANS_PORT*。
当两个请求均连接成功时，将两个连接互相 pipe。
同时，公网服务器将 *GATEWAY:CONNECT_PORT* 接受的连接和从队列中取出的公网连接互相 pipe。

如果互相 pipe 中的某一连接中断，则服务器会切断另一个连接。