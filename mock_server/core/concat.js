var fs = require('fs');
var path =require('path');
function concat(content, basePath) {
    var depContentArr = [];
    var deps = content.replace(/\r/g, '').split('\n')
    deps.forEach(function(dep) {
        depContentArr.push(fs.readFileSync(path.join(basePath, dep), 'utf8'));
    });
    return depContentArr.join('\n');
}

module.exports = concat;