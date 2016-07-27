/**
 * Created by Administrator on 2016/7/27.
 */
var app = require("../app.js");
var option =
{
    "mi": "5",
    "flag": "test",
    "timer": "5000"
}
apps = new app(option, function (data) {
    console.log("data:" + data);
})