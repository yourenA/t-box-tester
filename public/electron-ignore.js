// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog, MenuItem ,Menu} = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const os = require('os');
const fs = require('fs');
const handler = require('serve-handler');
const autoUpdater = require("electron-updater").autoUpdater;
const binding = require('sae_j2534_api');
const device = new binding.J2534(); //实例化设备
const {
    OpenCanDevice,
    CloseCanDevice,
    SetupDutPower,
    GetDutInfo,
    GetAllDutInfo,
    SelectDrawer,
    sleep
} = require('./saeUtil');
const {
    doTest,
    multiTest,
    singleTest,
    testDone
} = require('./ateUtil')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow; //mainWindow主窗口
let preLibrary;
let template = [ {
    label: '查看',
    submenu: [{
        label: '重载',
        accelerator: 'CmdOrCtrl+R',
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                // 重载之后, 刷新并关闭所有之前打开的次要窗体
                if (focusedWindow.id === 1) {
                    BrowserWindow.getAllWindows().forEach(win => {
                        if (win.id > 1) win.close()
                    })
                }
                focusedWindow.reload()
            }
        }
    }, {
        label: '切换全屏',
        accelerator: (() => {
            if (process.platform === 'darwin') {
                return 'Ctrl+Command+F'
            } else {
                return 'F11'
            }
        })(),
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
        }
    }, {
        label: '切换开发者工具',
        accelerator: (() => {
            if (process.platform === 'darwin') {
                return 'Alt+Command+I'
            } else {
                return 'Ctrl+Shift+I'
            }
        })(),
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                focusedWindow.toggleDevTools()
            }
        }
    }]
}, {
    label: '窗口',
    role: 'window',
    submenu: [{
        label: '最小化',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
    }, {
        label: '关闭',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
    }, {
        type: 'separator'
    }, {
        label: '重新打开窗口',
        accelerator: 'CmdOrCtrl+Shift+T',
        enabled: false,
        key: 'reopenMenuItem',
        click: () => {
            app.emit('activate')
        }
    }]
}]
function addUpdateMenuItems (items, position) {
    if (process.mas) return

    const version = app.getVersion()
    let updateItems = [{
        label: `版本 ${version}`,
        enabled: false
    },{
        label: '检查更新',
        key: 'checkForUpdate',
        click: () => {
            autoUpdater.checkForUpdates();
        }
    }]

    items.splice.apply(items, [position, 0].concat(updateItems))
}
const helpMenu = template[template.length - 1].submenu
addUpdateMenuItems(helpMenu, 0)

let setting = {
    "limit_max":850,
    "limit_min":800,
    "pre_interval": 2,
    "nor_interval": 60,
    "nor_duration": 120
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        minWidth: 1200,
        height: 740,
        minHeight: 740,
        icon: './favicon.png',
        center: true,
        webPreferences: {
            devTools: true, //是否开启 DevTools
            nodeIntegration: true
        },
        show: false
    })
    console.log('isDev', isDev)
    // and load the index.html of the app.
    let exePath = path.dirname(app.getPath('exe'));
    console.log('exePath:',exePath)
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000/");
        // Open the DevTools.
        mainWindow.webContents.openDevTools()

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
            mainWindow.loadURL('http://localhost:10386/index.html')
        });
        // mainWindow.loadURL(url.format({
        //     pathname: path.join(__dirname, './../build/index.html'), // 修改
        //     protocol: 'file:',
        //     slashes: true
        // }))
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

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

    //用户获取setting
    ipcMain.on('getSetting', (e) => {
        console.log('用户获取setting')
        fs.exists(exePath+'/setting.json', function(exists) {
            console.log(exists ? "文件存在" : "文件不存在");
            if(exists){
                fs.readFile(exePath+'/setting.json', "utf-8", function (error, data) {
                    if (error) return console.log("读取文件失败" + error.message);
                    console.log(data)
                    setting = {...setting, ...JSON.parse(data)}
                    mainWindow.webContents.send('getSettingFromMain', setting);
                });
            }else{
                mainWindow.webContents.send('getSettingFromMain', setting)
            }
        })
        mainWindow.webContents.send('getExePathFromMain',exePath)

    });

    //用户获取驱动
    ipcMain.on('getDrivers', (e) => {
        console.log('用户获取驱动')
        let arr = device.drivers; //驱动列表
        console.log('驱动个数：', arr.length)
        mainWindow.webContents.send('getDriversFromMain', arr)
    });

    //用户打开驱动
    ipcMain.on('openDrivers', (e, library) => {
        console.log('打开驱动', library);
        preLibrary=library
        mainWindow.webContents.send('openDriversFromMain',library)
    });

    //用户开始预测试
    ipcMain.on('startTest', async (e, tbox,flags) => {
        console.log('tbox', tbox)
        console.log('flags', flags)
        let openResult = OpenCanDevice({
            ...setting,
            library: preLibrary
        }, async(err) => {
            global.isTesting=false;
            openDialog({
                type: 'error',
                title: 'Error',
                message: err,
            })
            console.log('打开驱动失败')
            mainWindow.webContents.send('changeStart',false)
        })
        if(openResult!==0){
            return  false
        }
        let start_at=Date.now()
        let setupResult = SetupDutPower(setting,flags, (err) => {
            global.isTesting=false;
            openDialog({
                type: 'error',
                title: 'Error',
                message: err,
            });
            SetupDutPower(setting,0,()=>{});
            CloseCanDevice();
            global.isTesting=false;
            mainWindow.webContents.send('changeStart',false)
        })

        if (setupResult === 0) {
            let end_at=Date.now()
            console.log('delay',setting.pre_interval*1000-(end_at-start_at))
            await sleep(setting.pre_interval*1000-(end_at-start_at))
            console.log('启动开始测试成功,开始获取测试信息')
            global.isTesting=true;
            GetAllDutInfo( (result) => {
                mainWindow.webContents.send('sendInfoFromMain', {
                    result
                })
                CloseCanDevice()
                global.isTesting=false;
                mainWindow.webContents.send('changeStart',false)

            }, (err) => {
                CloseCanDevice()
                global.isTesting=false;
                mainWindow.webContents.send('changeStart',false)
            })
        }
    });

    let hadSetupArr=[];
    //用户停止测试
    ipcMain.on('stopTest', (e) => {
        for(let i=0;i<hadSetupArr.length;i++){
            const closeResult=SetupDutPower(setting,0,()=>{});
        }
        CloseCanDevice();
        hadSetupArr=[];
        global.isTesting=false;
        mainWindow.webContents.send('changeStart',false);
        mainWindow.webContents.send('computeFailureCount')
    });



    //用户开始正式测试
    ipcMain.on('startFormalTest', async (e, selectedDrawers) => {
        console.log('selectedDrawers',selectedDrawers.length)
        if(!global.isTesting){
            let openResult = OpenCanDevice({
                ...setting,
                library: preLibrary
            }, async(err) => {
                global.isTesting=false;
                openDialog({
                    type: 'error',
                    title: 'Error',
                    message: err,
                })
                console.log('打开驱动失败')
                mainWindow.webContents.send('changeStart',false)
            })
            if(openResult!==0){
                return  false
            }else{
                global.isTesting=true;
                mainWindow.webContents.send('changeStart',true)
            }
        }


        if (global.isTesting) {

            for(let i=0;i<selectedDrawers.length;i++){
                if(hadSetupArr.indexOf(selectedDrawers[i].index)>=0){
                    // console.log('已经置DUT电源')
                }else{
                    let flags='';
                    const reverseTBox=[...selectedDrawers[i].tBox].reverse()
                    for(let k=0;k<reverseTBox.length;k++){
                        if(reverseTBox[k].checked){
                            flags=flags+'1';
                        }else{
                            flags=flags+'0';
                        }
                    }
                    console.log('flags',flags)
                    let flags2=parseInt(Number(flags),2)
                    let setupResult = SetupDutPower(setting, flags2,(err) => {
                        mainWindow.webContents.send('computeFailureCount')
                    })
                    if(setupResult!==0){
                        continue
                    }else{
                        hadSetupArr.push(selectedDrawers[i].index)
                    }
                }
                let start_at=Date.now()



                let selectDrawerResult=SelectDrawer(selectedDrawers[i].index,(err) => {
                })
                if(selectDrawerResult===0){
                    // console.log('选择抽屉成功')
                    // global.isTesting=true;
                    GetAllDutInfo( (result) => {
                        mainWindow.webContents.send('sendInfoFromMain', {
                            drawerIndex:selectedDrawers[i].index,
                            result
                        })

                    }, (err) => {
                    })
                    if((i===selectedDrawers.length-1)){
                        // console.log('完成一轮测试')
                        let end_at=Date.now()
                        mainWindow.webContents.send('completeOneRound', setting.nor_interval*1000-(end_at-start_at))
                        mainWindow.webContents.send('computeFailureCount')
                    }

                }
            }
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
            console.log('res', res)
            if(res){
                mainWindow.webContents.send('exportCSVFromMain', res);
            }
        })
    });

    //用户导出CSV
    ipcMain.on('exportCSV2', (e) => {
        dialog.showSaveDialog({
            title: '导出',
            filters: [
                {name: 'csv', extensions: ['csv']},
            ]
        }, res => {
            console.log('res', res)
            if(res){
                mainWindow.webContents.send('exportCSVFromMain2', res);
            }
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
            console.log('res', res);
            if (res.length > 0) {
                fs.readFile(res[0], "utf-8", function (error, data) {
                    if (error) return console.log("读取文件失败,内容是" + error.message);
                    console.log(data)
                    setting = {...setting, ...JSON.parse(data)}
                    mainWindow.webContents.send('getSettingFromMain', setting);
                    openDialog({
                        type: 'info',
                        title: 'success',
                        message: '更新配置成功',
                    })
                });
            }
        })
    });

    //提示
    ipcMain.on('open-dialog', (e, message) => {
        openDialog(message)
    });
}

function openDialog(message) {
    dialog.showMessageBox(mainWindow,{
        type: message.type,
        title: message.title,
        message: message.message,
    })
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

    autoUpdater.setFeedURL('http://182.61.56.51:4000/electron/');
    autoUpdater.autoDownload = false //不强制下载
    autoUpdater.on('error', function (error) {
        sendUpdateMessage({
            type:'error',
            message:message.error
        })
    });
    autoUpdater.on('checking-for-update', function () {
        sendUpdateMessage({
            type:'info',
            message:message.checking
        })
    });
    autoUpdater.on('update-available', function (info) {
        sendUpdateMessage({
            type:'info',
            message:message.updateAva
        })
        autoUpdater.downloadUpdate().then(res => { //下载更新
            sendUpdateMessage({
                type:'success',
                message:'下载更新'
            })
        });
    });
    autoUpdater.on('update-not-available', function (info) {
        sendUpdateMessage({
            type:'success',
            message:message.updateNotAva
        })
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress', function (progressObj) {
        sendUpdateMessage({
            type:'info',
            message:'检测到新版本，正在下载: '+Number(progressObj.percent).toFixed(2)+" %"
        })
    })

    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        sendUpdateMessage({
            type:'success',
            message:'下载完成，开始更新'
        })
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
function sendUpdateMessage(msg) {
    mainWindow.webContents.send('updateMessage', msg)
}

