var mongodb = require('andon-bluetooth-database');



exports.insertdb=function (args) {
    mongodb.open(function (err, db) {
        if (err) {
            return err;
        }
        //读取 posts 集合
        db.collection('tb2', function (err, collection) {
            if (err) {
                mongodb.close();
            }
            var data = [args];
            collection.insert(data, function (err, result) {
                if (err) {
                    return err;
                }
                mongodb.close();
            });
        });
    });
}
 

