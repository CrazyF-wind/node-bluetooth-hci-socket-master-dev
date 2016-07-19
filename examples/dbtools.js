var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://192.168.31.108:27017/wilsondb1';



exports.insertdb=function (args) {
    var insertData = function(db, callback) {
        //连接到表
        var collection = db.collection('tb2');
        //插入数据
        var data = [args];
        collection.insert(data, function(err, result) {
            if(err)
            {
                console.log('Error:'+ err);
                return;
            }
            callback(result);
        });
    }

    MongoClient.connect(DB_CONN_STR, function(err, db) {
        console.log("连接成功！");
        //
        insertData(db, function(result) {
            console.log(result);
            db.close();
        });
    });
}
 

