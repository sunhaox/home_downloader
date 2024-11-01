# Home Downloader

[中文版](README.zh-CN.md)  
基于网页抓取、管理和下载多媒体m3u8文件并转码为mp4存储。

## 文件结构

主要分为两部分，server端和web端。

### Web端

基于React。所有Web端源文件都在`src`文件夹里。

### Server端

服务端后台代码是Python代码，基于Flask框架。所有Python源码位于`server`文件夹里。

## 编译要求和依赖

* npm 16+
* Python v3+
    * flask
    * flask_cors
    * gevent
    * loguru
    * requests
    * bs4

### Build

Git clone repo里的源码，然后安装依赖。

```
npm install
```

在`./server`目录下创建 `./server/static/css`, `./server/static/js` and `./server/templates` 这些文件夹。

```
mkdir ./server/static
mkdir ./server/static/css
mkdir ./server/static/js
mkdir ./server/templates
```

执行下面指令完成Web的编译，并自动拷贝到Server目录下。

```
npm run build
```

## 快速开始

```
cd server
python server.py
```

网站默认端口是8088，之后通过在浏览器里访问`localhost:8088`来访问控制页面。

## Docker
用下面命令创建docker镜像：
```
docker build -t home_downloader .
```

用下面命令启动docker容器：
```
docker run -dt --name home_downloader -p 8088:8088 -v /storage/media:/storage/media -v /home_downloader/config/:/config localhost/home_downloader:latest
```
默认端口号是`8088`。  
配置文件位于`/config`内。  
下载目录位于`/storage/media`内。也可以在配置文件`config.json`内修改。