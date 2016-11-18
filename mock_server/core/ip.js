var os = require('os');
/**
  * 获取指定网卡的IP
  * @param name 网卡名
  * @param family IP版本 IPv4 or IPv5
  * @returns ip
  */
exports.getLocalIP = function (name, family) {
    var family = "IPv4";
    //所有的网卡
    var ifaces = os.networkInterfaces();

    //移除loopback,没多大意义
    for (var dev in ifaces) {
        if (dev.toLowerCase().indexOf('loopback') != -1) {
            delete  ifaces[dev];
            continue;
        }
    }

    var ip = null;
    family = family.toUpperCase();

    var iface = null;
    if (name == null) {{
        for (var dev in ifaces)
            ifaces[dev].forEach(function (details) {
                if (details.family.toUpperCase() === family) {
                    if (details.address.indexOf("192.168") < 0) { //vpn ip为10.10.10.46
                        return;
                    }
                    ip = details.address;
                }
            });

        }
        return ip;
    }
    var nameList = name.split(',');
    for (var i = 0, j = nameList.length; i < j; i++) {
        var key = nameList[i];

        //指定的链接不存在
        if (ifaces[key] == null) {
            continue;
        }

        ifaces[key].forEach(function (details) {
            if (details.family.toUpperCase() === family) {
                ip = details.address;
            }
        });
        if (ip != null) {
            break;
        }
    }
    if (ip == null) {
        ip = '127.0.0.1';
        logger.error('get ip error, return 127.0.0.1, please check');
    }

    return ip;
}

//console.log(exports.getLocalIP());