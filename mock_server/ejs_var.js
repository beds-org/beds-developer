/**
 * mock server ejs配置
 * @param pathConfig
 * @returns {{isPub: boolean, title: string, keywords: string, desc: string, setTitle: ejsDefaultConst.setTitle, setKeywords: ejsDefaultConst.setKeywords, setDescription: ejsDefaultConst.setDescription, beApiRootPath: (*|string), cssRootPath: *, jsRootPath: (js|string|string|string|string|string|*), imgRootPath: (string|string|string), styleFileExt: string, jsFile: string, cssFile: string, entryJsFile: string, otherFiles: string, otherCssFiles: string, appName: string, setBizJs: ejsDefaultConst.setBizJs, getBizJs: ejsDefaultConst.getBizJs, setThirdpartyJs: ejsDefaultConst.setThirdpartyJs, getThirdpartyJs: ejsDefaultConst.getThirdpartyJs, setBizCss: ejsDefaultConst.setBizCss, getBizCss: ejsDefaultConst.getBizCss, setThirdpartyCss: ejsDefaultConst.setThirdpartyCss, getThirdpartyCss: ejsDefaultConst.getThirdpartyCss}}
 */
var ip = require("./core/ip").ip();
function getEjsVar(pathConfig, mockServerPort) {
    var ejsDefaultConst = {
        isPub: false,
        title: "",
        keywords: "",
        desc: "",
        setTitle: function (param) {
            this.title = param
        },
        setKeywords: function (param) {
            this.keywords = param
        },
        setDescription: function (param) {
            this.desc = param
        },
        beApiRootPath: "http://" + ip + ":" + mockServerPort + "/virtual-api",  //
        cssRootPath: pathConfig.css,
        jsRootPath: pathConfig.js,
        imgRootPath: pathConfig.img,
        styleFileExt: ".less",
        jsFile: '',
        cssFile: '',
        entryJsFile: '',// 入口模块名字。注意：在入口js文件内定义入口模块名时，必须与入口js文件名同名
        otherFiles: '', //第三方js文件
        otherCssFiles: '',//第三方css文件
        setJs: function (param) {
            if (typeof param != 'string') { //数组,入口文件放在数组最后一个位置。日后去掉seajs后可以去掉该限制
                var _this = this;
                param.forEach(function (p) {
                    _this.jsFile += '<script src="' + pathConfig.js + p + '"  type="text/javascript"></script>\n';
                    _this.entryJsFile = p;//日后去掉seajs后可以删除
                })
            } else {
                this.jsFile = '<script src="' + pathConfig.js + param + '"  type="text/javascript"></script>';
                this.entryJsFile = param;
            }

        },
        getJs: function () {
            var temp = this.jsFile;
            this.jsFile = '';
            return temp;
        },
        setThirdpartyJs: function (url) {
            if (typeof url == "string") {
                this.otherFiles += '    <script type="text/javascript" src="' + url + '"></script>';
            } else {
                var _otherFiles = '';
                url.forEach(function (e) {
                    _otherFiles += '\r\n    <script type="text/javascript" src="' + e + '"></script>';
                });
                this.otherFiles = _otherFiles;
            }
        },
        getThirdpartyJs: function () {
            var tmp = this.otherFiles;
            this.otherFiles = '';
            return tmp;
        },
        setCss: function (param) {
            if (typeof param != 'string') {
                var _this = this;
                param.forEach(function (p) {
                    _this.cssFile += "<link rel='stylesheet' type='text/css' href='" + pathConfig.css + p + "'/>\n";
                })
            } else {
                this.cssFile = "<link rel='stylesheet' type='text/css' href='" + pathConfig.css + param + "'/>"
            }
        },
        getCss: function () {
            var tmp = this.cssFile;
            this.cssFile = '';
            return tmp;
        },
        setThirdpartyCss: function (url) {
            if (typeof url == "string") {
                this.otherCssFiles += '    <link rel="stylesheet" type="text/css" href="' + url + '" />';
            } else {
                var _otherFiles = '';
                url.forEach(function (e) {
                    _otherFiles += '\r\n    <link rel="stylesheet" type="text/css" href="' + e + '" />';
                });
                this.otherCssFiles = _otherFiles;
            }
        },
        getThirdpartyCss: function () {
            var tmp = this.otherCssFiles;
            this.otherCssFiles = '';
            return tmp;
        }
    }
    return ejsDefaultConst;
}

exports.getEjsVar = getEjsVar;
