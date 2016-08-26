/**
 * Created by Administrator on 2016/7/27.
 */
var BluetoothHciSocket = require('./index');
var dbtools = require('./examples/dbtools');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var TempTime = new Date();  //初始扫描时间

var LeScanner = module.exports = function (option, callback) {

    console.log("option:" + JSON.stringify(option) + option["flag"] + option["timer"] + option["mi"]);
    //设置扫描时间
    //var TempTime = option["TempTime"];
    //设置扫描时间
    var timer = Number(option["timer"]);
    //设置扫描距离
    var mi = Number(option["mi"]);
    //标记位
    var flag = option["flag"];
    //手机型号
    var mobile = option["mobile"];


    var bluetoothHciSocket = new BluetoothHciSocket();
    //间隔参数：interval，window
    var parameter = option["parameter"];
    //设备名称
    const macName = option["macName"];

    bluetoothHciSocket.on('data', function (data) {
        console.log('data(hex): ' + data.toString('hex'));
        console.log('***********************************************8: ' + TempTime + "*******" + new Date());
        if ((new Date().getTime() - TempTime.getTime()) > timer) {
            console.log('stoptime:' + (new Date().getTime() - TempTime));
            console.log('TempTime+new time():' + TempTime + "," + new Date().getTime());
            bluetoothHciSocket.stop();
            callback("succeed");
        }
        else {
            if (data.readUInt8(0) === HCI_EVENT_PKT) {
                if (data.readUInt8(1) === EVT_CMD_COMPLETE) {
                    if (data.readUInt16LE(4) === LE_SET_SCAN_PARAMETERS_CMD) {
                        if (data.readUInt8(6) === HCI_SUCCESS) {
                            console.log('LE Scan Parameters Set');
                        }
                    } else if (data.readUInt16LE(4) === LE_SET_SCAN_ENABLE_CMD) {
                        if (data.readUInt8(6) === HCI_SUCCESS) {
                            console.log('LE Scan Enable Set');
                        }
                    }
                } else if (data.readUInt8(1) === EVT_LE_META_EVENT) {
                    if (data.readUInt8(3) === EVT_LE_ADVERTISING_REPORT) { // subevent
                        var gapAdvType = data.readUInt8(5);
                        var gapAddrType = data.readUInt8(6);
                        var gapAddr = data.slice(7, 13);

                        var eir = data.slice(14, data.length - 1);
                        var rssi = data.readInt8(data.length - 1);

                        console.log('LE Advertising Report');
                        console.log('\t' + ['ADV_IND', 'ADV_DIRECT_IND', 'ADV_SCAN_IND', 'ADV_NONCONN_IND', 'SCAN_RSP'][gapAdvType]);
                        console.log('\t' + ['PUBLIC', 'RANDOM'][gapAddrType]);
                        console.log('\t' + gapAddr.toString('hex').match(/.{1,2}/g).reverse().join(':'));
                        if (eir.toString('hex') != '') {
                            console.log('\t' + eir.toString('hex').match(/.{1,2}/g).join(' '));
                        }
                        console.log('\t' + eir.toString('hex'));
                        console.log('ser\t' + rssi);
                        console.log('time: ' + (new Date().getTime() - TempTime));
                        var mac = gapAddr.toString('hex').match(/.{1,2}/g).reverse().join(':');
                        var args =
                        {
                            "mac": mac,
                            "name": macName[mac],
                            "RSSI": rssi,
                            "time": new Date().getTime(),
                            "flag": flag,
                            "mi": mi,
                            "datetime": new Date(),
                            "mobile":mobile
                        };
                        dbtools.insertdb(args);
                        console.log('间隔时间:' + (new Date().getTime() - TempTime));
                        //callback(args);
                    }
                }
            }
        }

    });

    bluetoothHciSocket.on('error', function (error) {
        // TODO: non-BLE adaptor

        if (error.message === 'Operation not permitted') {
            console.log('state = unauthorized');
        } else if (error.message === 'Network is down') {
            console.log('state = powered off');
        } else {
            console.error(error);
        }
    });

    var HCI_COMMAND_PKT = 0x01;
    var HCI_ACLDATA_PKT = 0x02;
    var HCI_EVENT_PKT = 0x04;

    var EVT_CMD_COMPLETE = 0x0e;
    var EVT_CMD_STATUS = 0x0f;
    var EVT_LE_META_EVENT = 0x3e;

    var EVT_LE_ADVERTISING_REPORT = 0x02;

    var OGF_LE_CTL = 0x08;
    var OCF_LE_SET_SCAN_PARAMETERS = 0x000b;
    var OCF_LE_SET_SCAN_ENABLE = 0x000c;


    var LE_SET_SCAN_PARAMETERS_CMD = OCF_LE_SET_SCAN_PARAMETERS | OGF_LE_CTL << 10;
    var LE_SET_SCAN_ENABLE_CMD = OCF_LE_SET_SCAN_ENABLE | OGF_LE_CTL << 10;

    var HCI_SUCCESS = 0;

    function setFilter() {
        var filter = new Buffer(14);
        var typeMask = (1 << HCI_EVENT_PKT);
        var eventMask1 = (1 << EVT_CMD_COMPLETE) | (1 << EVT_CMD_STATUS);
        var eventMask2 = (1 << (EVT_LE_META_EVENT - 32));
        var opcode = 0;

        filter.writeUInt32LE(typeMask, 0);
        filter.writeUInt32LE(eventMask1, 4);
        filter.writeUInt32LE(eventMask2, 8);
        filter.writeUInt16LE(opcode, 12);

        bluetoothHciSocket.setFilter(filter);
    }

    /**
     * 参数设置
     * @param opt 间隔时间
     */
    function setScanParameters(opt) {
        var cmd = new Buffer(11);

        // header
        cmd.writeUInt8(HCI_COMMAND_PKT, 0);
        cmd.writeUInt16LE(LE_SET_SCAN_PARAMETERS_CMD, 1);

        // length
        cmd.writeUInt8(0x07, 3);

        // data
        cmd.writeUInt8(0x01, 4); // type: 0 -> passive, 1 -> active
        //cmd.writeUInt16LE(0x0010, 5); // internal, ms * 1.6
        //cmd.writeUInt16LE(0x0010, 7); // window, ms * 1.6
        cmd.writeUInt16LE(opt["scan-interval"], 5); // internal, ms * 1.6
        cmd.writeUInt16LE(opt["scan-window"], 7); // window, ms * 1.6
        cmd.writeUInt8(0x00, 9); // own address type: 0 -> public, 1 -> random
        cmd.writeUInt8(0x00, 10); // filter: 0 -> all event types

        bluetoothHciSocket.write(cmd);
    }

    function setScanEnable(enabled, duplicates) {
        var cmd = new Buffer(6);

        // header
        cmd.writeUInt8(HCI_COMMAND_PKT, 0);
        cmd.writeUInt16LE(LE_SET_SCAN_ENABLE_CMD, 1);

        // length
        cmd.writeUInt8(0x02, 3);

        // data
        cmd.writeUInt8(enabled ? 0x01 : 0x00, 4); // enable: 0 -> disabled, 1 -> enabled
        cmd.writeUInt8(duplicates ? 0x01 : 0x00, 5); // duplicates: 0 -> no duplicates, 1 -> duplicates

        bluetoothHciSocket.write(cmd);
    }

    bluetoothHciSocket.bindRaw();
    setFilter();
    bluetoothHciSocket.start();

    setScanEnable(false, false);

    setScanParameters(parameter);
    setScanEnable(true, false);


}
util.inherits(LeScanner, EventEmitter);