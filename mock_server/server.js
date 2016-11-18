var http = require("http");
var router = require("./core/router");
function start(config) {
    router.init(config);
    http.createServer(function(req, res) {
        router.route(req, res);
    }).listen(config.mockServerConfig.port);
}

exports.start = start;

//start(router.route, port);
//console.log("服务启动，端口号", port);
