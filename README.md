# go2tv Web Controller

[中文版](README.zh-CN.md)  
Control and cast media files to UPnP/DLNA Media Renderers and Smart TVs through go2tv based on web.

## File Structure

This project has two parts, server and front web.  

### Front Web

It developed based on React. The front web source files in `src` folder.

### Server

The server is written by Python based Flask. All source files in `server` folder.

## Build requirements and dependencies

* npm 16+
* Python v3+
    * flask
    * flask_cors
    * gevent

### Build

Git clone this repo and run this command to install the dependency.

```
npm install
```

Create `./server/static/css`, `./server/static/js` and `./server/templates` folders in `./server`.  

```
mkdir ./server/static
mkdir ./server/static/css
mkdir ./server/static/js
mkdir ./server/templates
```

This command will build the front web and copy output files to server folder.

```
npm run build
```

## Quick Start

```
cd server
python server.py
```

Then you can access to the web. The port by default is 8088. Simply open `localhost:8088` in a browser to see the control page.
