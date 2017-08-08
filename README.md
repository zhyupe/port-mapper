port-mapper
===========

A port mapping tool by node.js which helps accessing a back server (in LAN, etc), via a front server having public ip(s) and a client server that could access the back server.
Tested on Minecraft 1.7.2 server.

The project is published under GPLv2 License.

[Principle introduce (Simplified Chinese)][1]

### Other languages

 * [简体中文][2]

## Requirements

 * A front server has public ip(s)
 * A client server that can access the back server (You can just use the back server)
 * node.js runtime on **both** front and client server

## How to

 1. Edit settings in *config.json* .
 2. Upload files to both servers.
 3. Run ```npm install``` in port-mapper's folder on both servers.
 4. Run *server.js* on the **front** server.
 5. Run *client.js* on the **client** server.

***[Notice] You must do the step 3 first, or the client won't work correctly.***

## Setting Definition

Settings should be defined in *config.json*

**DO NOT** delete *config.example.json*. We need it to make sure the config structure is the latest version and the tool can work properly.

```javascript
{
    "LOG_LEVEL"    : "INFO", // The minimum level of log to be logged

    "GATEWAY"      : "",     // The ip or domain of the front server

    "SERVER_HOST"  : "",     // The ip or domain of the back server
    "SERVER_PORT"  : 80,     // The port of service on the back server

    "CONNECT_SIGN" : "",     // Auth been the two server and avoid unexpected forward
    "CONNECT_PORT" : 1201,   // The port to connect with the front server
    "TRANS_PORT"   : 1202,   // The port to trans to the front server
    "PUBLIC_PORT"  : 80,     // The port you can access from internet
    "PUBLIC_AUTH"  : false   // Authority client before mapping
         // false - disabled
         // true  - enabled, generate a random code when back server connected
         // "*"   - enabled, use a specified code
}
```

## Contributors
List of contributors can be found at [here][3].

  [1]: PRINCIPLE.md
  [2]: README.zh_CN.md
  [3]: https://github.com/zhyupe/port-mapper/graphs/contributors
