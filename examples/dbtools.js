var dbhelper = require('andon-bluetooth-database');


/**
 * lesan新增扫描记录
 * @param args
 */
exports.insertdb=function (args) {
    dbhelper.insertMongo('tb2', args, function (result) {
        if (result === "ok") {
            console.log("lesan新增扫描记录成功！");
        }
        else {
            console.log("lesan新增扫描记录失败，原因：" + JSON.stringify(result));
        }
    });
}

