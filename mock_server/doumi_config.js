/**
 * 注意!!!!改参数后记得要重启服务,否则不生效
 */
var proRootPath = './';
exports.fileRootPathConfig = {
    html : proRootPath, //html根目录
    js : proRootPath,  // js根目录
    css : proRootPath, //less根目录
    img : proRootPath, //图片根目录
    swf : proRootPath
}

//远程根路径配置
exports.remoteRootPathConfig = {
    js : "",
    css : "",
    img : "",
    beApiRootPath : "m.doumi.com", //php接口域名
    beApiServerPort : "80", //php接口端口号
    beAccessToken : { // token
        'doumi_melon' : ''
    }
}

//mock server 配置
exports.mockServerConfig = {
    port :8900 //端口号
}
