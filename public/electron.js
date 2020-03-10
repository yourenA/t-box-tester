// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain,dialog,shell} = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const os = require('os');
const fs = require('fs');
const handler = require('serve-handler');
const autoUpdater = require("electron-updater").autoUpdater;
const binding = require('sae_j2534_api');
const device = new binding.J2534(); //实例化设备
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow; //mainWindow主窗口

let setting={
    "protocol": 6,
    "baudrate": 500000,
    "flags": 0x00000800,
    "interval":1000,
    "filterType": 0x00000003,
    "mask": 0x7FF,
    "pattern": 0x7CD,
    "flowControl": 0x74D
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 700,
        minHeight: 700,
        icon: './favicon.png',
        center: true,
        webPreferences: {
            devTools: true, //是否开启 DevTools
            nodeIntegration: true
        },
        show: true
    })
    console.log('isDev', isDev)
    // and load the index.html of the app.

    if (isDev) {
        mainWindow.loadURL("http://localhost:3000/");

    } else {
        const http = require('http');
        const server = http.createServer((request, response) => {
            // You pass two more arguments for config and middleware
            // More details here: https://github.com/zeit/serve-handler#options
            return handler(request, response, {
                public: 'resources/app.asar/build',
            });
        })
        server.listen(10386, () => {
            mainWindow.loadURL( 'http://localhost:10386/index.html')
        });
        // mainWindow.loadURL(url.format({
        //     pathname: path.join(__dirname, './../build/index.html'), // 修改
        //     protocol: 'file:',
        //     slashes: true
        // }))
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null
    })
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.webContents.send('ping', 'whoooooooh!');
        updateHandle() //更新需要在页面显示之后，否则不能打印出相应的内容
        // createMbus()
    })


    //用户获取驱动
    ipcMain.on('getDrivers', (e) => {
        console.log('用户获取驱动')
        let arr = device.drivers; //驱动列表
        console.log('驱动个数：', arr.length)
        mainWindow.webContents.send('getDriversFromMain', arr)
    });

    //用户打开驱动
    ipcMain.on('openDrivers', (e, index, item) => {
        console.log('打开驱动', item.library)
        let openResult = device.open(item.library)
        mainWindow.webContents.send('openDriversFromMain', openResult, index, item)
    });

    //用户开始测试
    ipcMain.on('startTest', (e, tbox) => {
        console.log('tbox', tbox)
        console.log('setting',setting)
        if (0 != device.connect(setting.protocol, setting.baudrate, setting.flags)) { //连接设备,0表示成功，connect(protocol, baudrate, flags)
            console.log("device connect failure.");
        }
        let filter = device.startMsgFilter(setting.filterType, setting.mask, setting.pattern, setting.flowControl);//开始过滤消息（最后一个参数为流量控制消息ID），返回err和id
        if (0 != filter.err) {
            console.log("start msg filter failure.");
            device.disconnect();//终止与协议通道的逻辑连接，0表示成功
            device.close();//关闭与直通设备的连接，0表示成功
        }
    });

    //用户导出CSV
    ipcMain.on('exportCSV', (e) => {
        dialog.showSaveDialog({
            title: '导出',
            filters: [
                {name: 'csv', extensions: ['csv']},
            ]
        }, res => {
            console.log('res',res)
            mainWindow.webContents.send('exportCSVFromMain', res);
        })
    });

    //打开本地文件
    ipcMain.on('openFile', (e) => {
        dialog.showOpenDialog({
            title: '选择json文件',
            filters: [
                {name: 'json', extensions: ['json']},
            ]
        }, res => {
            console.log('res',res);
            if(res.length>0){
                fs.readFile(res[0], "utf-8", function(error, data) {
                    if (error) return console.log("读取文件失败,内容是" + error.message);
                    console.log(data)
                    setting={...setting,...JSON.parse(data)}
                    mainWindow.webContents.send('getFileFromMain', setting);
                });
            }
        })
    });

    //提示
    ipcMain.on('open-dialog', (e,message) => {
        dialog.showMessageBox({
            type:message.type,
            title:message.title,
            message:message.message,
        })
    });
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    console.log('process.platform', process.platform) //平台
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    console.log('activate')
    if (mainWindow === null) createWindow()
})


function updateHandle() {
    let message = {
        error: '检查更新出错',
        checking: '正在检查更新……',
        updateAva: '检测到新版本，正在下载……',
        updateNotAva: '现在使用的就是最新版本，不用更新',
    };

    autoUpdater.setFeedURL('http://localhost:3000/electron/');
    autoUpdater.autoDownload = false //不强制下载
    autoUpdater.on('error', function (error) {
        sendUpdateMessage(message.error)
    });
    autoUpdater.on('checking-for-update', function () {
        sendUpdateMessage(message.checking)
    });
    autoUpdater.on('update-available', function (info) {
        sendUpdateMessage(message.updateAva) //
        autoUpdater.downloadUpdate().then(res => { //下载更新
            sendUpdateMessage('下载更新')
        });
    });
    autoUpdater.on('update-not-available', function (info) {
        sendUpdateMessage(message.updateNotAva)
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress', function (progressObj) {
        sendUpdateMessage(progressObj.percent) //progressObj里面包含有下载的进度
    })

    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        sendUpdateMessage('下载完成，开始更新')
        autoUpdater.quitAndInstall();

        // ipcMain.on('isUpdateNow', (e, arg) => { //监听渲染发送过来的消息，比如用户按确定键后再开始跟新
        //   console.log("开始更新");
        //   sendUpdateMessage('开始更新')
        //   //some code here to handle event
        //   autoUpdater.quitAndInstall();
        // });
        // mainWindow.webContents.send('isUpdateNow') //像渲染层发送消息

    });

    ipcMain.on('UpdateNow', (e, arg) => { //ipcMain主进程监听渲染发送过来的消息，比如用户按确定键后再开始更新
        console.log('用户点击查询更新')
        //如果不是手动更新，将checkForUpdates提取到外面直接执行。
        autoUpdater.checkForUpdates(); //向服务端查询现在是否有可用的更新。在调用这个方法之前，必须要先调用 setFeedURL。
    });

}

function sendUpdateMessage(text) {
    mainWindow.webContents.send('ping', text)
}

