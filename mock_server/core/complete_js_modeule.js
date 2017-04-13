var fs = require('fs');
var _ = require('underscore');
var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
var SLASH_RE = /\\\\/g;

function transport(filename, content) {
    filename = filename.replace(/^[\/\\]*/, ''); //去掉路径开头的可能存在的斜杠。如果存在斜杠，则moduleid 不匹配
    var deps = JSON.stringify(parseDependencies(content));
    return 'define("' + filename.replace(/\\/g, '/') + '", ' + deps + ', function (require, exports, module) {\n' + content + '\n});';
}

function parseDependencies(code) {
    var ret = [];

    code.replace(SLASH_RE, '')
        .replace(REQUIRE_RE, function (m, m1, m2) {
            if (m2) {
                ret.push(m2);
            }
        });

    return _.unique(ret.sort(), true);
}
exports.transport = transport;
