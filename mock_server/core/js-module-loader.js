/**
 * beds-developer 专用js模块加载器。 注入到入口html中使用
 */

var BD = this.BD = {};
BD.buffer = {};

/**
 * shim,mainly to ie8
 */
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(callback) {
        // 获取数组长度
        var len = this.length;
        if(typeof callback != "function") {
            throw new TypeError();
        }
        for(var i = 0; i < len; i++) {
            if(i in this) {
                // callback函数接收三个参数：当前项的值、当前项的索引和数组本身
                callback.call(window, this[i], i, this);
            }
        }
    }
}

if (!Array.isArray){
    Array.isArray = function(arg){
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

if (!Object.keys) {
    Object.keys = function (o) {
        if (o !== Object(o))
            throw new TypeError('Object.keys called on a non-object');
        var k = [], p;
        for (p in o) if (Object.prototype.hasOwnProperty.call(o, p)) k.push(p);
        return k;
    }
}

if (!Array.prototype.map) {
    Array.prototype.map = function ArrayMap(callback) {
        // 获取数组长度
        var len = this.length;
        if(typeof callback != "function") {
            throw new TypeError();
        }
        // 创建跟原数组相同长度的新数组，用于承载经回调函数修改后的数组元素
        var newArr = new Array(len);
        for(var i = 0; i < len; i++) {
            if(i in this) {
                newArr[i] = callback.call(this, this[i], i, this);
            }
        }
        return newArr;
    }
}


;(function(BD){
    var doc = window.document,
        a = {},
        expose = +new Date(),
        rExtractUri = /((?:http|https|file):\/\/.*?\/[^:]+)(?::\d+)?:\d+/,
        isLtIE8 = ('' + doc.querySelector).indexOf('[native code]') === -1;
    BD.getCurrExecJsAbsPath = function(){
        // FF,Chrome
        if (doc.currentScript){
            return doc.currentScript.src;
        }

        var stack;
        try{
            a.b();
        }
        catch(e){
            stack = e.fileName || e.sourceURL || e.stack || e.stacktrace;
        }
        // IE10
        if (stack){
            var absPath = rExtractUri.exec(stack)[1];
            if (absPath){
                return absPath;
            }
        }

        // IE5-9
        for(var scripts = doc.scripts,
                i = scripts.length - 1,
                script; script = scripts[i--];){
            if (script.className !== expose && script.readyState === 'interactive'){
                script.className = expose;
                // if less than ie 8, must get abs path by getAttribute(src, 4)
                return isLtIE8 ? script.getAttribute('src', 4) : script.src;
            }
        }
    };
}(BD));

/**
 * util
 */
(function (BD) {
    var util = BD.util = {};
    var MULTIPLE_SLASH_RE = /([^:\/])\/\/+/g;
    var DIRNAME_RE = /.*(?=\/.*$)/;
    var body = document.body || document.getElementsByTagName( 'body' )[0];
    util.loadScript = function (params, callback) {
        var node = document.createElement('script');
        var done = false;
        var timer = null;
        params = params || {};
        node.setAttribute('type', 'text/javascript');
        node.setAttribute('charset', 'utf-8');
        node.setAttribute('async', true);
        callback = callback || function () {
            };
        if (params.url) {
            node.src = params.url;
        } else if (params.text) {
            node.text = params.text;
        }

        node.onload = node.onreadystatechange = function () {
            if (!done &&
                ( !this.readyState ||
                    this.readyState === 'loaded' ||
                    this.readyState === 'complete'
                )
            ) {
                // clear
                done = true;
                clearTimeout(timer);
                node.onload = node.onreadystatechange = null;
                callback();
            }
        };

        node.onerror = function (e) {
            clearTimeout(timer);
            body.removeChild(node);
            callback(e);
        };

        timer = setTimeout(function () {
            body.removeChild(node);
            callback(new Error('time out'));
        }, 30000); // 30s

        body.appendChild(node);

        return node;
    };
    util.path = {
        dirname: function (url) {
            var match = url.match(DIRNAME_RE);
            return (match ? match[0] : '.') + '/';
        },
        pathname: function(url) {
            return url.replace(/^\w+:\/\/.*?(?=\/)/, '').replace(/\?.*$/, '')
        },
        isAbsolute: function (url) {
            return /^(\w+:\/\/|\/\/|\/)/.test(url);
        },
        normalize: function (path) {
            MULTIPLE_SLASH_RE.lastIndex = 0;

            // 'http://a//b/c' ==> 'http://a/b/c'
            if (MULTIPLE_SLASH_RE.test(path)) {
                path = path.replace(MULTIPLE_SLASH_RE, '$1\/');
            }
            return path;
        }
    };
})(BD);
/**
 * deferred
 */
(function () {
    BD.Deferred = function () {
        var PENDING = 'pending';
        var DONE = 'done';
        var FAIL = 'fail';

        var state = PENDING;
        var callbacks = {
            'done': [],
            'fail': [],
            'always': []
        };

        var args = [];
        var thisArg = {};

        var pub = {
            done: function (cb) {
                if (state === DONE) {
                    setTimeout(function () {
                        cb.apply(thisArg, args);
                    }, 0);
                }

                if (state === PENDING) {
                    callbacks.done.push(cb);
                }
                return pub;
            },
            fail: function (cb) {
                if (state === FAIL) {
                    setTimeout(function () {
                        cb.apply(thisArg, args);
                    }, 0);
                }

                if (state === PENDING) {
                    callbacks.fail.push(cb);
                }
                return pub;
            },
            always: function (cb) {
                if (state !== PENDING) {
                    setTimeout(function () {
                        cb.apply(thisArg, args);
                    }, 0);
                    return;
                }

                callbacks.always.push(cb);
                return pub;
            },
            resolve: function () {
                if (state !== PENDING) {
                    return pub;
                }

                args = [].slice.call(arguments);
                state = DONE;
                dispatch(callbacks.done);
                return pub;
            },
            reject: function () {
                if (state !== PENDING) {
                    return pub;
                }

                args = [].slice.call(arguments);
                state = FAIL;
                dispatch(callbacks.fail);
                return pub;
            },
            state: function () {
                return state;
            },
            promise: function () {
                var ret = {};
                Object.keys(pub).forEach(function (k) {
                    if (k === 'resolve' || k === 'reject') {
                        return;
                    }
                    ret[k] = pub[k];
                });
                return ret;
            }
        };

        function dispatch(cbs) {
            var cb;
            while ((cb = cbs.shift()) || (cb = callbacks.always.shift())) {
                setTimeout((function (fn) {
                    return function () {
                        fn.apply({}, args);
                    };
                })(cb), 0);
            }
        }

        return pub;
    };

    BD.when = function (defers) {
        if (!Array.isArray(defers)) {
            defers = [].slice.call(arguments);
        }
        var ret = BD.Deferred();
        var len = defers.length;
        var count = 0;
        var results = [];

        if (!len) {
            return ret.resolve().promise();
        }

        defers.forEach(function (defer, i) {
            defer
                .fail(function (err) {
                    ret.reject(err);
                })
                .done(function (result) {
                    results[i] = result;
                    if (++count === len) {
                        ret.resolve.apply(ret, results);
                    }
                });
        });

        return ret.promise();
    };
})(BD);

/**
 * module
 * */
(function (global, BD, util) {
    var STATUS = {
        'ERROR': -2,   // The module throw an error while compling
        'FAILED': -1,   // The module file's fetching is failed
        'FETCHING': 1,    // The module file is fetching now.
        'FETCHED': 2,    // The module file has been fetched.
        'SAVED': 3,    // The module info has been saved.
        'READY': 4,    // The module is waiting for dependencies
        'COMPILING': 5,    // The module is in compiling now.
        'PAUSE': 6,    // The moudle's compling is paused()
        'COMPILED': 7     // The module is compiled and module.exports is available.
    };


    global.define = function (id, deps, fn) { //前提：此时id已经被server处理成了绝对路径
        if (typeof id !== 'string') {
            //throw new Error('module.id must be a string');
            if (!deps) { //一个参数
                fn = id;
                deps = [];
            }
            if (!fn) { //两个参数
                fn = deps;
                deps = [];
            }
            id = util.path.pathname(BD.getCurrExecJsAbsPath());
        }

        id = /\.js(\?.*)?$/.test(id) ? id : id + '.js'; //没有后缀加上后缀，因为cache统一使用绝对路径存储

        if (!fn) { //没有依赖
            fn = deps;
            deps = [];
        }

        delete BD.buffer[id];
        if (Module.cache[id] && Module.cache[id].status >= STATUS.SAVED) {
            return;
        }
        return Module.save(id, deps, fn);
    };

    function Require(context) {
        function require(id) {
            id = require.resolve(id);
            if (!Module.cache[id] || Module.cache[id].status !== STATUS.COMPILED) {
                throw new Error('Module not found:' + id);
            }
            return Module.cache[id].exports;
        }

        //统一将路径转换成绝对路径
        require.resolve = function (id) {


            if (!util.path.isAbsolute(id)) {


                if (/^(\.\/|^\w)/.test(id)) {
                    id = context + id.replace(/^\.\//, '');
                } else {
                    var parentPathArr = context.split(/\/+/);
                    var subPathArr = id.split(/\/+/);
                    var i = 0;
                    while (/\.\./.test(subPathArr[i])) {
                        parentPathArr.pop();
                        i++;
                    }
                    id = parentPathArr.join('/') + id;
                }

            }
            id = util.path.normalize(id);
            return /\.js(\?.*)?$/.test(id) ? id : id + '.js';
        };

        return require;
    }

    BD.Require = Require;

    var Module = {};

    Module.cache = {};
    Module.defers = {};
    Module.STATUS = STATUS;

    Module.getOrCreate = function (id) {
        if (!Module.cache[id]) {
            Module.cache[id] = {
                id: id,
                status: 0,
                dependencies: []
            };
            Module.defers[id] = BD.Deferred();
        }
        return Module.cache[id];
    };

    Module.compile = function (module) {
        var deps, exports;
        module.status = STATUS.READY;

        if (typeof module.factory === 'function') {
            module.status = STATUS.COMPILING;
            try {

                // define( id, deps, function (require, exports, module ) {} );
                module.exports = {};


                exports = module.factory.call(window, new Require(util.path.dirname(module.id)), module.exports, module);

                if (exports) {
                    module.exports = exports;
                }

            } catch (ex) {
                module.status = STATUS.ERROR;
                Module.fail(module, ex);
                throw ex;
            }
        } else {
            module.exports = module.factory;
        }

        if (module.status !== STATUS.PAUSE) {
            module.status = STATUS.COMPILED;
            Module.defers[module.id].resolve();
        }
    };

    Module.fail = function (module, err) {
        Module.defers[module.id].reject(err);
        throw err;
    };

    Module.save = function (id, deps, fn) {
        var module = Module.getOrCreate(id);
        var require = new Require(util.path.dirname(id));

        var deps = deps.map(function (dep) {
            return Module.getOrCreate(require.resolve(dep)); //id为宿主模块路径，宿主模块路径一定为绝对路径。见router jsContentHandle部分
        });

        module.dependencies = deps;
        module.factory = fn;
        module.status = STATUS.SAVED;

        deps = deps.map(function (dep) {
            if (dep.status < STATUS.FETCHING) {
                dep.status = STATUS.FETCHING;

                dep.url = dep.id;

                BD.buffer[dep.id] = dep;
            }

            return Module.defers[dep.id];
        });

        BD.when(deps)
            .done(function () {
                Module.compile(module);
            })
            .fail(function (err) {
                Module.fail(module, err);
            });

        // 延迟到`script`标签的onLoad之后，
        // 以避免一个`script`标签内多个`define`带来的依赖重复加载问题
        setTimeout(function () {
            var modules = Object.keys(BD.buffer);
            modules.forEach(function (id) {
                var module = BD.buffer[id];
                delete BD.buffer[id];
                BD.util.loadScript({url: module.url}, function (err) {
                    if (err) {
                        return BD.Module.fail(module, err);
                    }
                });
            });
        }, 0);
    };

    BD.Module = Module;

})(window, BD, BD.util);
