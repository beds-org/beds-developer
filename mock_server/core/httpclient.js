var http = require('http');
var querystring = require('querystring');
var cookie = require('./cookie.js');

//create(null,null,null)("/topic/getverificationcode?mobile=15110083715", "get", null);
function create(req ,res, config) {
    var host = config.beApiRootPath,
        port = config.beApiServerPort;
    return function(remoteUri , method, data){
        var reqHeaders = {};
        if (!method ) { method = 'GET';}
        if (!host){
            console.log("没指定远程主机");
        }
        data = querystring.stringify(data);
        var proxyHeaders = reqHeaders;
        var proxyDomain = ['snakeproxy', 'XREF', 'seashell', 'clientIp', 'referer', 'cookie', 'user-agent'];
        proxyHeaders.host = host;
        //设置请求头
        for(var i=0,j = proxyDomain.length ; i < j ;i++ ){
            if (req.headers.hasOwnProperty(proxyDomain[i]) ) {
                proxyHeaders[proxyDomain[i]] = req.headers[proxyDomain[i]]
            }
        }
        if (config.beAccessToken) {
            proxyHeaders['cookie'] || (proxyHeaders['cookie'] = '');
            for (var tokenKey in config.beAccessToken) {
                var tokenVal = config.beAccessToken[tokenKey];
                proxyHeaders['cookie'] += "; " + tokenKey + "=" + tokenVal;
            }

        }
        if ('GET' == method){
            if (data) {
                remoteUri = remoteUri.trim()
                remoteUri += (remoteUri.indexOf('?')>0 ? '&' : '?') + querystring.stringify(data);
            }
            data = ''
        }else{
            proxyHeaders['Content-Type'] =  'application/x-www-form-urlencoded'
        }
        proxyHeaders['Content-Length'] =  Buffer.byteLength(data,'utf8') //data.length
        proxyHeaders['Cache-Control'] = 'no-cache';
        var options = {
            host : host,
            port : port ,
            headers: proxyHeaders,
            path : remoteUri,
            method : method
        };
        var request = http.request(options , function(response) {
            //console.log('STATUS: ' + response.statusCode);
            //response.setEncoding('utf8');

            var res_state = response.statusCode;
            if  (200 != res_state && 400 != res_state && 4000 > res_state) {
                console.log("api请求出错：host:" + host + "; remoteApi:" + remoteUri + "; method:" + method + "; data:" + data);
            }
            var result = '';
            response.on('data', function (chunk) {
                result += chunk;
            }).on('end' , function(){
                if (400 == res_state){

                }

                if ('""' == result) result = false

                var proxyDomains = ['set-cookie']
                for (var i = proxyDomains.length-1;i>=0 ;i--){
                    var proxyKey = proxyDomains[i]
                    if (proxyKey in response.headers){
                        var pdVal = response.headers[proxyKey]
                        if (!pdVal) break
                        if ('set-cookie' == proxyKey) {
                            var cookie_set = cookie.getHandler(req , res)
                            pdVal.forEach(function(cookie_v){
                                cookie_set.set(cookie_v)
                            })
                        }else
                            res.setHeader( proxyKey , pdVal)

                    }
                }
                res.writeHead( res_state, {'Content-Type': response.headers['content-type'] //content-type取决于接口的content-type
                    ,'Cache-Control': 'no-cache,no-store'
                    ,"Access-Control-Allow-Methods" : "GET,POST,PUT,DELETE,OPTIONS"
                    ,"Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
                    , "Access-Control-Allow-Origin" : '*'
                });
                res.write(result);
                res.end();
            });
        });
        request.on('error' , function(e){
            console.log('api请求出错', e);
            res.write("api请求出错：" + e + "; remoteApi:" + remoteUri + "; method:" + method + "; data:" + data);
            res.end();
        });
        request.write(data);
        request.end();
    }
}

//form-data
//formdi

exports.__create = create;
