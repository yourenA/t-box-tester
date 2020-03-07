// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const url = require('url');
const autoUpdater = require("electron-updater").autoUpdater;
const binding = require('sae_j2534_api');
const device = new binding.J2534(); //实例化设备
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow; //mainWindow主窗口


function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 900,
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
        // mainWindow.loadURL("http://182.61.56.51:4001/");

        // mainWindow.loadURL(`file://${path.join(__dirname,'./../build/index.html')}`);
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, './../build/index.html'), // 修改
            protocol: 'file:',
            slashes: true
        }))
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

