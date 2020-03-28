/**************************/
/* ProtocolID definitions */
/**************************/
const CAN = 5;
const ISO15765 = 6;

/*******************************/
/* PassThruConnect definitions */
/*******************************/
// 0 = Receive standard CAN ID (11 bit)
// 1 = Receive extended CAN ID (29 bit)
const CAN_29BIT_ID = 0x00000100;
// 0 = either standard or extended CAN ID types used ?CAN ID type defined by bit 8
// 1 = both standard and extended CAN ID types used ?if the CAN controller allows prioritizing either standard
// (11 bit) or extended (29 bit) CAN ID's then bit 8 will determine the higher priority ID type
const CAN_ID_BOTH = 0x00000800;

/************************/
/* RxStatus definitions */
/************************/
// 0 = received i.e. this message was transmitted on the bus by another node
// 1 = transmitted i.e. this is the echo of the message transmitted by the PassThru device
const TX_MSG_TYPE = 0x00000001;
// 0 = Not a start of message indication
// 1 = First byte or frame received
const START_OF_MESSAGE = 0x00000002;
const ISO15765_FIRST_FRAME = 0x00000002;	/*v2 compat from v0202*/
const ISO15765_EXT_ADDR = 0x00000080;	/*DT Accidentally refered to in spec*/
// 0 = No break received
// 1 = Break received
const RX_BREAK = 0x00000004;
// 0 = No TxDone
// 1 = TxDone
const TX_INDICATION = 0x00000008;	// Preferred name
const TX_DONE = 0x00000008;
// 0 = No Error
// 1 = Padding Error
const ISO15765_PADDING_ERROR = 0x00000010;
// 0 = no extended address,
// 1 = extended address is first byte after the CAN ID
const ISO15765_ADDR_TYPE = 0x00000080;

/***********************/
/* TxFlags definitions */
/***********************/
// 0 = no padding
// 1 = pad all flow controlled messages to a full CAN frame using zeroes
const ISO15765_FRAME_PAD = 0x00000040;
//ISO15765_ADDR_TYPE					0x00000080  defined above
//CAN_29BIT_ID							0x00000100  defined above

/**********************/
/* Filter definitions */
/**********************/
// Allows matching messages into the receive queue. This filter type is only valid on non-ISO 15765 channels
const PASS_FILTER = 0x00000001;
// Keeps matching messages out of the receive queue. This filter type is only valid on non-ISO 15765 channels
const BLOCK_FILTER = 0x00000002;
// Allows matching messages into the receive queue and defines an outgoing flow control message to support
// the ISO 15765-2 flow control mechanism. This filter type is only valid on ISO 15765 channels.
const FLOW_CONTROL_FILTER = 0x00000003;


let CANID_FRAME_HOST = 0x7C5;
let CANID_FRAME_ECU = 0x7CD;
let CANID_DRAWER_HOST = 0x7C6;
let CANID_DRAWER_ECU = 0x7CE;

let SID_WRITE_DATA_BY_IDENTIFIER = 0x2E;
let SID_READ_DATA_BY_IDENTIFIER = 0x22;

let FRAME_DID_DRAWER_SELECT = 0x0110;
let DRAWER_DID_DUT_SWITCH = 0x0110;
let DRAWER_DID_DUT_ALL = 0x0120;

const binding = require('sae_j2534_api');
const device = new binding.J2534();

var frameFilter;
var drawerFilter;

global.isTesting=false;

/*
 *  打开Can设备
 */
function OpenCanDevice(setting, errCb) {
    console.log('打开Can设备...')
    if (0 != device.open(setting.library)) {
        errCb("Device open failure.");
        return -1;
    }

    if (0 != device.connect(ISO15765, 500000, CAN_ID_BOTH)) {
        device.close();
        errCb("Bus connect failure.");
        return -1;
    }

    frameFilter = device.startMsgFilter(FLOW_CONTROL_FILTER, 0x7FF, CANID_FRAME_ECU, CANID_FRAME_HOST);

    if (0 != frameFilter.err) {
        device.disconnect();
        device.close();
        errCb("Start frame msg filter failure.");
        return -1;
    }
    drawerFilter = device.startMsgFilter(FLOW_CONTROL_FILTER, 0x7FF, CANID_DRAWER_ECU, CANID_DRAWER_HOST);

    if (0 != drawerFilter.err) {
        device.disconnect();
        device.close();
        errCb("Start drawer msg filter failure.");
        return -1;
    }
    console.log('打开Can设备成功')
    console.log(device)
    return 0;
}

/*
 *  关闭Can设备
 */
function CloseCanDevice() {
    console.log('关闭设备',frameFilter)
    if (frameFilter) {
        device.stopMsgFilter(frameFilter.id);
    }
    if (drawerFilter) {
        device.stopMsgFilter(drawerFilter.id);
    }
    device.disconnect();
    device.close();
}


/*
 * 设置DUT电源（启动关闭测试）
 * flags, 12位长度数值类型，每位代表对应的DUT电源开关，0为关，1为开
 * limit, 限制电流，单位毫安。超出该值时，自动关闭电源，范围：0 - 50000
 */
function SetupDutPower(setting,flags, errCb) {
    // return 0;
    var request = Buffer.from([SID_WRITE_DATA_BY_IDENTIFIER,
        DRAWER_DID_DUT_SWITCH >> 8,
        DRAWER_DID_DUT_SWITCH,
        flags >> 8,
        flags,
        setting.limit_max >> 8,
        setting.limit_max,
        setting.limit_min >> 8,
        setting.limit_min]);
    /* 发送设置请求 */
    if(flags===0){
        console.log('发送断电.')
    }else{
    }
    var ret = device.send(CANID_DRAWER_HOST, request, 1000);
    // var ret = 0
    if (0 != ret) {
        console.log("SetupDutPower Send request failure %d.", ret);
        errCb(`SetupDutPower Send request failure ${ret}`)
        return -1;
    }
    /* 等待回复 */
    while (1) {
        var respond = device.recv(1000);
        if (0 != respond.err) {
            console.log("SetupDutPower Recv respond failure %d.", respond.err);
            errCb(`SetupDutPower Recv respond failure ${respond.err}`)
            return -1;
        }

        if ((TX_MSG_TYPE | START_OF_MESSAGE) & respond.flags) {
            continue; //进入下一次循环
        }

        if (respond.payload.length != 3) {
            console.log("SetupDutPower Invalid respond length %d", respond.payload.length);
            errCb(`SetupDutPower Invalid respond length ${respond.payload.length}`)
            return -1;
        }

        if (respond.payload[0] != (SID_WRITE_DATA_BY_IDENTIFIER + 0x40)) {
            console.log("SetupDutPower Invalid SID 0x%s", respond.payload[0].toString(16));
            errCb(`SetupDutPower Invalid SIDh ${respond.payload[0].toString(16)}`)
            return -1;
        }

        var did = (respond.payload[1] << 8) | respond.payload[2];
        if (DRAWER_DID_DUT_SWITCH != did) {
            console.log("SetupDut PowerInvalid respond did 0x%s", did.toString(16));
            errCb(`SetupDutPower Invalid respond did ${did.toString(16)}`)
            return -1;
        }
        console.log('设置DUT电源成功')
        return 0;
    }
    return -1;
}

/*
 * 获取测试信息
 * index, DUT索引，范围 1 - 12
 * cb, 获取成功后回调函数
 */
function  GetDutInfo(index, cb, errCb) {
    console.log('index',index)
    var request = Buffer.from([SID_READ_DATA_BY_IDENTIFIER, 0x01, 0x10 + index]);
    /* 发送设置请求 */
    var ret = device.send(CANID_DRAWER_HOST, request, 1000);
    // var ret = 0
    if (0 != ret) {
        console.log("GetDutInfo Send request failure %d.", ret);
        errCb(`GetDutInfo Send request failure ${ret}`)
        return -1;
    }
    /* 等待回复 */
    while (1) {
        var respond = device.recv(1000);
        if (0 != respond.err) {
            console.log("GetDutInfo Recv respond failure %d.", respond.err);
            errCb(`GetDutInfo Recv respond  failure ${respond.err}`)
            return -1;
        }

        if ((TX_MSG_TYPE | START_OF_MESSAGE) & respond.flags) {
            continue;
        }

        console.log('respond.payload',respond.payload)

        if (respond.payload.length != 10) {
            console.log("GetDutInfo Invalid respond length %d", respond.payload.length);
            errCb(`GetDutInfo Invalid respond length ${respond.payload.length}`)
            return -1;
        }

        if (respond.payload[0] != (SID_READ_DATA_BY_IDENTIFIER + 0x40)) {
            console.log("GetDutInfo Invalid SID 0x%s", respond.payload[0].toString(16));
            errCb(`GetDutInfo Invalid SID 0x${respond.payload[0].toString(16)}`)
            return -1;
        }

        var did = (respond.payload[1] << 8) | respond.payload[2];
        if ((0x110 + index) != did) {
            console.log("GetDutInfo Invalid respond did 0x%s", did.toString(16));
            errCb(`GetDutInfo Invalid respond did 0x${did.toString(16)}`)
            return -1;
        }
        var sw = respond.payload[3];		/* 电源开关状态，备注：电源状态为关闭，并且该DUT需要测试时，代表当前DUT异常 */
        var avg = (respond.payload[4] << 8) | respond.payload[5];  /* 平均电流 */
        var max = (respond.payload[6] << 8) | respond.payload[7];  /* 最大电流 */
        var min = (respond.payload[8] << 8) | respond.payload[9];  /* 最小电流 */
        cb(Date.now(),sw, avg, max, min);
        return 0;
    }
    return -1;
}

/*
 * 获取测试信息
 * index, DUT索引，范围 1 - 12
 * cb, 获取成功后回调函数
 */
function  GetAllDutInfo(cb, errCb) {
    var request = Buffer.from([SID_READ_DATA_BY_IDENTIFIER,
        DRAWER_DID_DUT_ALL >> 8,
        DRAWER_DID_DUT_ALL]);
    /* 发送设置请求 */
    var ret = device.send(CANID_DRAWER_HOST, request, 1000);
    // var ret = 0
    if (0 != ret) {
        console.log("GetDutInfo Send request failure %d.", ret);
        errCb(`GetDutInfo Send request failure ${ret}`)
        return -1;
    }
    /* 等待回复 */
    while (1) {
        var respond = device.recv(1000);
        if (0 != respond.err) {
            console.log("GetDutInfo Recv respond failure %d.", respond.err);
            errCb(`GetDutInfo Recv respond  failure ${respond.err}`)
            return -1;
        }

        if ((TX_MSG_TYPE | START_OF_MESSAGE) & respond.flags) {
            continue;
        }

        console.log('respond.payload',respond.payload)

        if (respond.payload.length < 10 || (respond.payload.length - 3) % 7 != 0) {
            console.log("GetDutInfo Invalid respond length %d", respond.payload.length);
            errCb(`GetDutInfo Invalid respond length ${respond.payload.length}`)
            return -1;
        }

        if (respond.payload[0] != (SID_READ_DATA_BY_IDENTIFIER + 0x40)) {
            console.log("GetDutInfo Invalid SID 0x%s", respond.payload[0].toString(16));
            errCb(`GetDutInfo Invalid SID 0x${respond.payload[0].toString(16)}`)
            return -1;
        }

        var did = (respond.payload[1] << 8) | respond.payload[2];
        if (DRAWER_DID_DUT_ALL != did) {
            console.log("GetDutInfo Invalid respond did 0x%s", did.toString(16));
            errCb(`GetDutInfo Invalid respond did 0x${did.toString(16)}`)
            return -1;
        }

        var time = Date.now();
        var result=[]
        for(var pos = 3, index = 1; pos < respond.payload.length; pos = pos +7) {
            var sw = respond.payload[pos];		/* 电源开关状态，备注：电源状态为关闭，并且该DUT需要测试时，代表当前DUT异常 */
            var avg = (respond.payload[pos + 1] << 8) | respond.payload[pos + 2];  /* 平均电流 */
            var max = (respond.payload[pos + 3] << 8) | respond.payload[pos + 4];  /* 最大电流 */
            var min = (respond.payload[pos + 5] << 8) | respond.payload[pos + 6];  /* 最小电流 */
            result.push({
                index, time,sw,min, avg, max
            })
            index++
        }
        cb(result)
        return 0;
    }
    return -1;
}

/*
 * 选择通信抽屉
 * index, 抽屉索引，范围 0 - 20, 0 为全关闭
 */
function SelectDrawer(index,errCb) {
    return 0;
    var request = Buffer.from([SID_WRITE_DATA_BY_IDENTIFIER, FRAME_DID_DRAWER_SELECT >> 8, FRAME_DID_DRAWER_SELECT, index]);
    /* 发送设置请求 */
    var ret = device.send(CANID_FRAME_HOST, request, 1000);
    // var ret = 0;
    if (0 != ret) {
        console.log("SelectDrawer Send request failure %d.", ret);
        errCb(`SelectDrawer Send request failure ${ret}`)
        return -1;
    }
    // return 0;
    /* 等待回复 */
    while (1) {
        var respond = device.recv(1000);
        if (0 != respond.err) {
            console.log("SelectDrawer Recv respond failure %d.", respond.err);
            errCb(`SelectDrawer Recv respond failure ${respond.err}`)
            return -1;
        }

        if ((TX_MSG_TYPE | START_OF_MESSAGE) & respond.flags) {
            continue;
        }

        if (respond.payload.length != 3) {
            console.log("SelectDrawer Invalid respond length %d", respond.payload.length);
            errCb(`SelectDrawer Invalid respond length ${respond.payload.length}`)
            return -1;
        }

        if (respond.payload[0] != (SID_WRITE_DATA_BY_IDENTIFIER + 0x40)) {
            console.log("SelectDrawer Invalid SID 0x%s", respond.payload[0].toString(16));
            errCb(`SelectDrawer Invalid SID 0x${respond.payload[0].toString(16)}`)
            return -1;
        }
        var did = (respond.payload[1] << 8) | respond.payload[2];
        if (FRAME_DID_DRAWER_SELECT != did) {
            console.log("SelectDrawer Invalid respond did 0x%s", did.toString(16));
            errCb(`SelectDrawer Invalid respond did 0x${did.toString(16)}`)
            return -1;
        }
        // successCb()
        return 0;
    }
    return -1;
}


function sleep(t) {
    return new Promise(res => setTimeout(res, t))
}


module.exports = {
    OpenCanDevice,
    CloseCanDevice,
    SetupDutPower,
    GetDutInfo,
    GetAllDutInfo,
    SelectDrawer,
    sleep
};