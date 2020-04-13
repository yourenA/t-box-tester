const AteApi = require('ate_tbox');

function updateHandle(infos) {
    for(var i = 0; i < infos.duts.length; i++){
        console.log("<%d-%d>: sw[%d] avg[%d] min[%d] max[%d]",
            infos.index,
            i,
            infos.duts[i].sw,
            infos.duts[i].avg,
            infos.duts[i].min,
            infos.duts[i].max);
    }
}

function testDone(infos) {
    console.log("test done");
    /* 关闭设备 */
    if (0 != AteApi.CloseDevice()) {
        console.log("device close failure.");
    }
    console.log("device close success.");
    //process.exit();
}

function singleTest() {
    var interval = 2;
    if (0 != AteApi.StartSingleTest(interval, updateHandle, testDone)) {
        console.log("Start Single Test failure.");
        AteApi.CloseDevice();
    }
}

function multiTest() {
    var interval = 2;
    var duration = 30;
    var flags = 0x5;
    if (0 != AteApi.StartMultiTest(interval, duration, flags, updateHandle, testDone)) {
        console.log("Start Single Test failure.");
        AteApi.CloseDevice();
        process.exit();
    }
}

function doTest() {
    for(let i = 0; i < AteApi.drivers.length; i++){
        console.log("Discover Driver: ", AteApi.drivers[i].name);
    }
    /* 打开设备 */
    if (0 != AteApi.OpenDevice(AteApi.drivers[2].library)) {
        console.log("device open failure.");
        process.exit();
    }
    console.log("device open success.");
    /* 选择通信抽屉 */
    if (0 != AteApi.SelectDrawer(0)) {
        console.log("Select Drawer failure.");
        AteApi.CloseDevice();
        process.exit();
    }
    /* 设置DUT电源 */
    if (0 != AteApi.SetupDutPower(0xFFF, 800, 200)) {
        console.log("Setup Dut Power failure.");
        AteApi.CloseDevice();
        // process.exit();
    }
    // singleTest();
    //multiTest();
}
module.exports = {
    doTest,
    multiTest,
    singleTest,
    testDone,
    updateHandle
};