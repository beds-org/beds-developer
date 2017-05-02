/**
 * 前端测试服务器
 * @type {exports}
 */
var Promise = require('bluebird');
var colors = require('colors');
var fs = require("fs");
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var mime = require('./mime');
var httpclient = require('./httpclient');
var ejs = require("ejs");
var ejsVar = require('../ejs_var');
var less = require("less");
var completeJs = require('./complete_js_modeule');
var concat = require('./concat');
var babel = require('babel-core');
var es2015 = require('babel-preset-es2015'); //必须这样引入模块。否则babel会从业务项目根目录查找转译器

var dmConfig = null;
var fileRootPath = null;
var remoteRootPath = null;
var currRemoteRootPath = remoteRootPath;
var basePath = fileRootPath;

function init(config) {
    dmConfig = config;
    fileRootPath = dmConfig.fileRootPathConfig;
    basePath = fileRootPath;
    remoteRootPath = dmConfig.remoteRootPathConfig;
    currRemoteRootPath = remoteRootPath;
}

function route(req, res) {
    var reqUrl = url.parse(req.url);
    if (reqUrl.pathname.indexOf('/favicon.ico') > -1) {
        res.end();
        return;
    }
    var pathName = reqUrl.pathname;
    req.__get = {};
    reqUrl.query = querystring.parse(reqUrl.query);
    for (var k in reqUrl.query) {
        req.__get[k.replace(/[<>%\'\"]/g, '')] = reqUrl.query[k];
    }
    //代理服务器
    if (pathName.indexOf("/virtual-api") > -1) {
        req.__post = {};
        if (req.method == "POST") {
            var data = '';
            req.addListener('data', function (chunk) {
                data += chunk;
            }).addListener('end', function () {
                data = querystring.parse(data);
                req.__post = data;
                apiReq();
            });
        } else {
            apiReq();
        }
        function apiReq() {
            httpclient.__create(req, res, currRemoteRootPath)(reqUrl.path.replace("/virtual-api", "").replace(/\/+/g, "/"), req.method, req.__post);
        }

        return;
    }

    var fileObj;

    fileObj = new FileHandle(pathName);
    try {
        fileObj.promise.then(function () {
            responseReq.call(res, fileObj);
        }).catch(function (e) {
            onErr(e.toString(), res);
            console.log(e.toString().bgRed);
        });
    } catch (e) {
        onErr(JSON.stringify(fileObj), res);
    }
}

/**
 * 响应请求
 * @param fileObj
 */
function responseReq(fileObj) {
    var res = this;
    res.writeHeader(200, {
        'Content-Type': mime.types[fileObj.fileType] + ';charset=utf-8'
    });
    res.write(fileObj.fileContent, fileObj.fileEncoding);
    res.end();
}


function onErr(error, res, stateCode) {
    res.writeHead(stateCode || 404, {'Content-Type': 'text/plain;charset=utf-8'});
    res.write(error);
    res.end();
}

function FileHandle(pathName) {
    var _this = this;
    this.pathName = pathName;
    this.fileType = null;
    var pos = pathName.lastIndexOf('.');
    if (pos < 0) return null;
    this.realFileType = pathName.substr(pos + 1);
    this.fileType = FileHandle.fileTypeMAP[this.realFileType];
    this.fileEncoding = (this.fileType == 'img' || this.fileType == 'swf') ? 'binary' : 'utf8';
    try {
        this.fileAbsPath = FileHandle[this.fileType + "PathHandle"].call(this);
    } catch (e) {
        console.log(e, this.fileType, this.pathName);
    }
    this.promise = new Promise(function (resolve, reject) {
        _this.resolve = resolve;
        _this.reject = reject;
        FileHandle.getFileContentBySync.call(_this);
    }).then(function () {
        return FileHandle[_this.fileType + "ContentHandle"].call(_this);
    })
    /*.catch(function(error) {
     console.log("promise: " + error);
     })*/
};
FileHandle.fileTypeMAP = {
    'html': 'html',
    'js': 'js',
    'vue': 'js',
    'tpl': 'js',
    'css': 'css',
    'less': 'css',
    'png': 'img',
    'gif': 'img',
    'jpg': 'img',
    'swf': 'swf',
}

FileHandle.htmlPathHandle = function () {
    return basePath.html + this.pathName;
}
FileHandle.jsPathHandle = function () {
    if (/\.html\.js$/.test(this.pathName)) {
        this.pathName = this.pathName.replace(/\.js$/, '');
    }
    return basePath.js + this.pathName;
}
FileHandle.cssPathHandle = function () {
    return basePath.css + this.pathName;
}
FileHandle.imgPathHandle = function () {
    return basePath.img + this.pathName;
}

FileHandle.swfPathHandle = function () {
    return basePath.swf + this.pathName;
}


FileHandle.getFileContentBySync = function () {
    var _this = this;
    fs.readFile(this.fileAbsPath, this.fileEncoding, function (e, content) {
        if (e) {
            _this.reject(e);
        } else {
            _this.fileContent = content;
            _this.resolve();
        }
    });
}
FileHandle.htmlContentHandle = function () {
    try {
        //解析ejs模板
        this.fileContent = ejs.render(this.fileContent, ejsVar.getEjsVar(remoteRootPath, dmConfig.mockServerConfig.port), {root: fileRootPath.html, filename: this.fileAbsPath})
    } catch (e) {
        throw new Error("模板错误：" + e);
    }
}

FileHandle.jsContentHandle = function () {
    if (/\.html$/.test(this.pathName)) { //说明js在请求组件模板,使html模板模块化
        this.fileContent = "module.exports = " + JSON.stringify(this.fileContent);
    }

    var pathReg = dmConfig.traditionJsPathReg;
    if (!pathReg || !pathReg.test(this.pathName)) { //处理非库目录js文件内容,库目录js文件内容直接返回

        this.fileContent = babel.transform(this.fileContent, { //babel转译es6语法
            presets: [es2015]
        }).code;
        this.fileContent = completeJs.transport(this.pathName, this.fileContent); //构建成cmd结构
    }

}


FileHandle.cssContentHandle = function () {
    var _this = this;
    if (_this.realFileType == 'less') {
        return new Promise(function (resolve, reject) {
            less.render(_this.fileContent, {paths:[path.dirname(_this.fileAbsPath), basePath.css]}, function (e, content) {
                if (e) {
                    console.log('less parse :', e);
                }
                _this.fileContent = content.css;
                resolve();
            })
        });
    }
}
FileHandle.imgContentHandle = function () {
    /*无需特别处理*/
}

FileHandle.swfContentHandle = function () {
    /*无需特别处理*/
}

exports.init = init;
exports.route = route;
