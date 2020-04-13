import React, {PureComponent, Fragment} from 'react';
import './App.css';
import moment from 'moment';
import Button from '@material-ui/core/Button';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuIcon from '@material-ui/icons/ArrowBack';
import CancelScheduleSendIcon from '@material-ui/icons/CancelScheduleSend';
import SaveIcon from '@material-ui/icons/Save';
import Grid from '@material-ui/core/Grid';
import {parseAsync} from 'json2csv';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite';
import ViewQuiltIcon from '@material-ui/icons/ViewQuilt';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import ErrorIcon from '@material-ui/icons/Error';
import {withStyles, makeStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Drawer from '@material-ui/core/Drawer';
import filter from 'lodash/filter'
import ReactJson from 'react-json-view'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import SettingsIcon from '@material-ui/icons/Settings';
import AccessAlarmIcon from '@material-ui/icons/AccessAlarm';
var Mousetrap = require('mousetrap');
const StyledTableCell = withStyles(theme => ({
    head: {
        backgroundColor: '#3f51b5',
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const StyledTableRow = withStyles(theme => ({
    root: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        },
    },
}))(TableRow);

function createData(name, calories, fat, carbs, protein) {
    return {name, calories, fat, carbs, protein};
}

let rows = []
for (let i = 0; i < 7; i++) {
    rows.push(
        createData(`Frozen yoghurt${i}`, 1, 6.0, 24, 4.0)
    )
}

const {ipcRenderer} = window.electron;
const {BrowserWindow} = window.electron.remote;
const fs = window.electron.remote.require('fs')

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

class App extends PureComponent {
    constructor(props) {
        super(props);
        this.timer = null
        this.state = {
            drivers: [],
            selectDriver: '',
            errorOpen: false,
            dialogOpen: false,
            startLoading: false,
            checkedAll: false,
            checkedAllTbox:false,
            isTesting: false,
            drawerOpen: false,
            selectTBox: false,
            nowTab: 0,
            errorName: '',
            setting: {},
            drawers: [],
            selectedDrawers: [],
            nowDrawer: 0,
            testTBoxFailureCount:'',
            testDuring:1,
            leftTime:0
        };
    }

    componentDidMount() {
        for (let i = 0; i < 20; i++) {
            this.state.drawers.push({
                index: i + 1,
                name:Math.ceil((i+1)/4)+'-'+((i+1)%4===0?4:(i+1)%4),
                checkedAllTBox: true,
                tBox: [{name: 'T-Box-1', index: 1, sw: '',min:'', avg: '', max: '', checked:true, time: ''},
                    {name: 'T-Box-2', index: 2, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-3', index: 3, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-4', index: 4, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-5', index: 5, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-6', index: 6, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-7', index: 7, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-8', index: 8, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-9', index: 9, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-10', index: 10, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-11', index: 11, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                    {name: 'T-Box-12', index: 12, sw: '',min:'', avg: '', max: '', checked: true, time: ''},
                ]
            })
        }
        this.setState({
            drawers: this.state.drawers
        })
        console.log('componentDidMount in pre')
        const that = this;
        ipcRenderer.send('getDrivers')
        ipcRenderer.send('getSetting')
        ipcRenderer.on('getExePathFromMain', function (event, exePath) {
            console.log('exePath', exePath)
        });
        ipcRenderer.on('getSettingFromMain', function (event, setting) {
            that.setState({
                setting,
                testDuring:setting.nor_duration
            })
        });
        ipcRenderer.on('getDriversFromMain', function (event, message) {
            console.log('获取到的驱动2', message)
            that.setState({
                drivers: message,
            })
            if(message.length>0){
                that.setState({
                    selectDriver:message[0].library
                })
                ipcRenderer.send('openDrivers',message[0].library);
            }
        });
        ipcRenderer.on('openDriversFromMain', function (event, library) {
            console.log('打开驱动', library)
            that.setState({
                selectDriver: library,
            })
        });

        ipcRenderer.on('exportCSVFromMain2', (event, message) => {
            let opts = {fields: ['drawer_name','tBox_name', 'time', 'sw', 'min(mA)','avg(mA)', 'max(mA)']};
            let csvContent = [];
            for (let i = 0; i < that.state.drawers.length; i++) {
                for(let j=0;j<that.state.drawers[i].tBox.length;j++){
                    if (that.state.drawers[i].tBox[j].checked) {
                        csvContent.push({
                            drawer_name: that.state.drawers[i].name,
                            tBox_name: that.state.drawers[i].tBox[j].name,
                            time: that.state.drawers[i].tBox[j].time,
                            sw: that.state.drawers[i].tBox[j].sw,
                            [`min(mA)`]: that.state.drawers[i].tBox[j].min,
                            [`avg(mA)`]: that.state.drawers[i].tBox[j].avg,
                            [`max(mA)`]: that.state.drawers[i].tBox[j].max
                        })
                    }
                }

            }
            console.log('csvContent', csvContent)
            parseAsync(csvContent, opts).then(csv => {
                fs.writeFile(message, csv,  { 'encoding ': 'utf-8' },err => {
                    if (err) {
                        console.log('err', err)
                        ipcRenderer.send('open-dialog', {
                            type: "error",
                            title: "Error",
                            message: err.toString()
                        });
                        return false
                    }
                    ;
                    console.log('导出成功')
                    ipcRenderer.send('open-dialog', {
                        type: "info",
                        title: "Success",
                        message: '导出CSV成功'
                    });
                });
            }).catch(err => console.error(err));
        })

        ipcRenderer.on('sendInfoFromMain', (event, msg) => {
            for (let i = 0; i < that.state.drawers.length; i++) {
                if (that.state.drawers[i].index === msg.drawerIndex) {
                    for(let k=0;k<msg.result.length;k++){
                        if (that.state.drawers[i].tBox[k].checked&&(that.state.drawers[i].tBox[k].index === msg.result[k].index)) {
                            that.state.drawers[i].tBox[k].time = moment(msg.result[k].time).format('HH:mm:ss');
                            that.state.drawers[i].tBox[k].sw = msg.result[k].sw;
                            that.state.drawers[i].tBox[k].min = msg.result[k].min;
                            that.state.drawers[i].tBox[k].avg = msg.result[k].avg;
                            that.state.drawers[i].tBox[k].max = msg.result[k].max;
                        }
                    }
                    that.setState({
                        drawers:that.state.drawers
                    })
                  /*  for (let j = 0; j < that.state.drawers[i].tBox.length; j++) {
                        if (that.state.drawers[i].tBox[j].index === msg.tBoxIndex) {
                            that.state.drawers[i].tBox[j].time = moment(msg.time).format('HH:mm:ss');
                            that.state.drawers[i].tBox[j].sw = msg.sw;
                            that.state.drawers[i].tBox[j].min = msg.min;
                            that.state.drawers[i].tBox[j].avg = msg.avg;
                            that.state.drawers[i].tBox[j].max = msg.max;
                        }
                    }*/
                }
            }
            that.setState({
                drawers: [...that.state.drawers]
            })
        })
        ipcRenderer.on('computeFailureCount', (event) => {
            let  testTBoxFailureCount=0;
            for(let i=0;i<this.state.drawers.length;i++){
                const failureCount=filter(this.state.drawers[i].tBox,row=>{
                    return  row.checked&& Number(row.sw)===0
                }).length;
                testTBoxFailureCount=testTBoxFailureCount+failureCount
            }
            that.setState({
                testTBoxFailureCount:testTBoxFailureCount
            })


        })
        ipcRenderer.on('changeStart', (event, bool) => {
            console.log('bool', bool)
            that.setState({
                isTesting: bool
            },function () {
                if(!that.state.isTesting){
                    that.setState({
                        leftTime:0
                    })
                    if(that.timerOfLeft){
                        clearInterval(that.timerOfLeft)
                        that.timerOfLeft=null
                    }
                }
            })
        })

        ipcRenderer.on('completeOneRound', (event, delay) => {
            console.log('完成一轮测试',delay)
            this.timer = setTimeout(() => {
                if(that.state.isTesting){
                    that.startTest()
                }else{
                    console.log('进入setTimeout,但已经停止')
                    clearTimeout(that.timer)
                }

            }, delay?delay:10000)
        })


        ipcRenderer.on('startComputeTime', () => {
            if(!that.timerOfLeft){
                that.clearData()
                that.computeTime();
            }
        })

        Mousetrap.bind('ctrl+d', () => {
            if (this.state.isTesting) {
                return;
            }
            if (!this.state.selectDriver) {
                ipcRenderer.send('open-dialog', {
                    type: "error",
                    title: "Error",
                    message: '请先选择驱动'
                });
                return
            }
            let afterFilter = filter(this.state.drawers, o => {
                let exitTBoxfilter = filter(o.tBox, i => {
                    return i.checked
                })
                return exitTBoxfilter.length > 0
            });
            console.log('afterFilter', afterFilter)
            if (afterFilter.length === 0) {
                ipcRenderer.send('open-dialog', {
                    type: "error",
                    title: "Error",
                    message: '请先选择T-Box'
                });
                return
            }
            this.setState({
                dialogOpen: true,
                selectedDrawers: afterFilter
            },function () {
                this.startTest()
            })

        })

        Mousetrap.bind('ctrl+e', () => {
            if (this.state.isTesting) {
                return;
            }
            this.exportCSV()
        })

    }
    componentWillUnmount() {
        if(this.timer){
            clearTimeout(this.timer)
        }
        if(this.timerOfLeft){
            clearInterval(this.timerOfLeft)
            this.timerOfLeft=null
        }
        ipcRenderer.send('stopTest');
        ipcRenderer.removeAllListeners()
    }
    timeStamp=( second_time )=>{
        function fixZero(number) {
            if(number<10){
                return '0'+number
            }
            else{
                return  number
            }
        }
        let time ="00:00:"+fixZero(parseInt(second_time));
        if( parseInt(second_time )> 59){

            let second = fixZero(parseInt(second_time) % 60);
            let min = fixZero(parseInt(second_time / 60));
            time ="00:"+min+":"+second;

            if( min > 59 ){
                min = fixZero(parseInt(second_time / 60) % 60);
                let hour = fixZero(parseInt( parseInt(second_time / 60) /60 ));
                time =hour+":"+min+":"+second;


            }


        }

        return time;
    }
    handleChangeSelect = (event) => {
        console.log(event)
        if (this.state.selectDriver === event.target.value) {
            console.log('没有改变')
            return false
        }

        ipcRenderer.send('openDrivers', event.target.value);
    }

    handleChangeTBoxCheck = (index) => {
        let nowDrawer = this.state.drawers[this.state.nowDrawer];
        nowDrawer.tBox[index].checked = !nowDrawer.tBox[index].checked;
        this.setState({
            drawers: [...this.state.drawers]
        }, function () {
            this.checkedAllState();
            this.checkedAllTBoxState()
        })

    }
    exportCSV = () => {
        try {
            ipcRenderer.send('exportCSV2');
        } catch (err) {
            console.error(err);
        }
    }
    openFile = () => {
        ipcRenderer.send('openFile');
    }
    checkedAll = () => {
        let nowDrawer = this.state.drawers[this.state.nowDrawer];
        nowDrawer.checkedAllTBox = !nowDrawer.checkedAllTBox;
        this.setState({
            drawers: [...this.state.drawers]
        }, function () {
            if (this.state.drawers[this.state.nowDrawer].checkedAllTBox) {
                for (let i = 0; i < this.state.drawers[this.state.nowDrawer].tBox.length; i++) {
                    this.state.drawers[this.state.nowDrawer].tBox[i].checked = true;

                }
            } else {
                for (let i = 0; i < this.state.drawers[this.state.nowDrawer].tBox.length; i++) {
                    this.state.drawers[this.state.nowDrawer].tBox[i].checked = false;

                }
            }
            this.setState({
                drawers: [...this.state.drawers]
            },function () {
                this.checkedAllTBoxState()

            })
        })
    }
    checkedAllState = () => {
        let all = true
        for (let i = 0; i < this.state.drawers[this.state.nowDrawer].tBox.length; i++) {
            if (!this.state.drawers[this.state.nowDrawer].tBox[i].checked) {
                all = false
            }
        }
        this.state.drawers[this.state.nowDrawer].checkedAllTBox = all
        this.setState({
            drawers: [...this.state.drawers]
        })
    }
    handleCheckedAllTbox = (e) => {
        console.log('e',e.target.checked)
        let drawers = this.state.drawers;
        for(let i=0;i<drawers.length;i++){
            drawers[i].checkedAllTBox = e.target.checked
            for(let j=0;j<drawers[i].tBox.length;j++){
                drawers[i].tBox[j].checked=e.target.checked;
            }
        }
        this.setState({
            checkedAllTbox:!this.state.checkedAllTbox,
            drawers:[...drawers]
        })
    }
    checkedAllTBoxState = () => {
        let all = true
        for (let i = 0; i < this.state.drawers.length; i++) {
            for (let j = 0; j < this.state.drawers[i].tBox.length; j++) {
                if (!this.state.drawers[i].tBox[j].checked) {
                    all = false
                }
            }
        }
        this.setState({
            checkedAllTbox: all
        })
    }
    startTest = () => {
        console.log('this.timerOfLeft',this.timerOfLeft)

        this.setState({
            dialogOpen: false,
            // startLoading: true,
            isTesting: true,
        }, function () {
            ipcRenderer.send('startFormalTest', this.state.selectedDrawers,this.state.drawers,this.state.testDuring);
        });

    }
    clearData=()=>{
        for (let i = 0; i < this.state.drawers.length; i++) {
            for (let j = 0; j < this.state.drawers[i].tBox.length; j++) {
                this.state.drawers[i].tBox[j].sw="";
                this.state.drawers[i].tBox[j].time="";
                this.state.drawers[i].tBox[j].avg="";
                this.state.drawers[i].tBox[j].min="";
                this.state.drawers[i].tBox[j].max="";
            }
        }
        this.setState({
            drawers:this.state.drawers
        })
    }
    computeTime=()=>{
        const testDuring=this.state.testDuring*60;
        console.log('测试时间:',testDuring);
        const that=this;
        this.setState({
            leftTime:testDuring
        })
        this.timerOfLeft=setInterval(()=>{
            that.setState({
                leftTime:that.state.leftTime-1
            },function () {
                if(that.state.leftTime===0){
                    console.log('倒计时为0')
                    if(that.timer){
                        clearTimeout(that.timer)
                    }
                    if(that.timerOfLeft){

                        clearInterval(that.timerOfLeft)
                        that.timerOfLeft=null
                    }

                    // ipcRenderer.send('stopTest');
                }
            })
        },1000)
    }

    render() {
        let  testTBoxCount=0;
        for(let i=0;i<this.state.drawers.length;i++){
            for(let j=0;j<this.state.drawers[i].tBox.length;j++){
                if(this.state.drawers[i].tBox[j].checked){
                    testTBoxCount++
                }
            }
        }
        let slectDrawers = filter(this.state.drawers, o => {
            let exitTBoxfilter = filter(o.tBox, i => {
                return i.checked
            })
            return exitTBoxfilter.length > 0
        }).length;
        return (
            <div>
                <AppBar position="fixed">
                    <Toolbar style={{display:'flex'}}>
                        <IconButton onClick={() => {
                            if(!this.state.isTesting){
                                this.props.history.replace('/')
                            }else{
                                ipcRenderer.send('open-dialog', {
                                    type: "error",
                                    title: "Error",
                                    message: '退出前请先停止测试'
                                });
                            }
                        }} edge="start" color="inherit" aria-label="menu">
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6" style={{flex:1}}>
                            老化抽屉正式测试
                        </Typography>
                        <IconButton  color="secondary"
                                     title={'如果需要自定义配置，请在exe安装目录新建setting.json文件'}
                                     onClick={()=>{
                                         this.setState({
                                             drawerOpen:!this.state.drawerOpen
                                         })
                                     }}>
                            <SettingsIcon
                                style={{ color: '#fff' }}
                            />
                        </IconButton>


                    </Toolbar>
                </AppBar>
                <Grid container spacing={3} className={'pre-box'}>
                    <Grid item xs={8}>
                        <div className={'table-content'}>

                            <div style={{marginTop: '12px'}} className={'drawers'}>
                                {
                                    this.state.drawers.map((item, index) => {
                                        let selectTBoxLenght = filter(item.tBox, (o) => {
                                            return o.checked
                                        }).length;
                                        let hasError=false;
                                        for(let i=0;i<item.tBox.length;i++){
                                            let row2=item.tBox[i];
                                            if(row2.checked&&
                                                row2.time&&(Number(row2.sw)===0&&row2.checked
                                                )){
                                                hasError=true;
                                                break;

                                            }
                                        }
                                        return (
                                            <div  className={'drawersItem'} key={index}>
                                                <Button

                                                    style={{width: '95%'}}
                                                    onClick={() => {
                                                        this.setState({
                                                            nowDrawer: index,
                                                        })
                                                    }}
                                                    variant="contained" size={"small"}
                                                    color={index===this.state.nowDrawer?"primary":"default"}
                                                >
                                                    {item.name} ({selectTBoxLenght}) <span  className={`${hasError?'hasError':''} status`}></span>
                                                </Button>
                                            </div>

                                        )
                                    })
                                }
                            </div>
                            {this.state.drawers.map((row, index) => {
                                return <Typography
                                    key={index}
                                    component="div"
                                    role="tabpanel"
                                    hidden={this.state.nowDrawer !== index}
                                    aria-labelledby={`vertical-tab-${index}`}
                                >
                                    {this.state.nowDrawer === index && <div>
                                        <TableContainer
                                            style={{maxHeight: ' calc(100vh - 330px)', border: '1px solid #333'}}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <StyledTableCell>
                                                            <Checkbox
                                                                disabled={this.state.isTesting}
                                                                checked={this.state.drawers[this.state.nowDrawer] && this.state.drawers[this.state.nowDrawer].checkedAllTBox}
                                                                onChange={() => this.checkedAll()}
                                                            />
                                                        </StyledTableCell>
                                                        <StyledTableCell>TBox名称</StyledTableCell>
                                                        <StyledTableCell align="left">时间</StyledTableCell>
                                                        <StyledTableCell align="left">状态</StyledTableCell>
                                                        <StyledTableCell align="left">最小电流(mA)</StyledTableCell>
                                                        <StyledTableCell align="left">平均电流(mA)</StyledTableCell>
                                                        <StyledTableCell align="left">峰值电流(mA)</StyledTableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {row.tBox.map((row2, index2) => {
                                                        return (
                                                            <StyledTableRow
                                                                className={`${row2.checked ? 'table-checked' : ''}
                                                                  ${row2.time&&Number(row2.sw)===0&&row2.checked ? 'error-row' : ''}`}
                                                                role="checkbox" key={row2.name}>
                                                                <StyledTableCell padding="checkbox">
                                                                    <Checkbox
                                                                        color="primary"
                                                                        disabled={this.state.isTesting}
                                                                        checked={row2.checked}
                                                                        onChange={() => this.handleChangeTBoxCheck(index2)}
                                                                        value={row2.key}
                                                                    />
                                                                </StyledTableCell>
                                                                <StyledTableCell scope="row">
                                                                    {row2.name}
                                                                </StyledTableCell>
                                                                <StyledTableCell
                                                                    align="left">{row2.time}</StyledTableCell>

                                                                <StyledTableCell align="left">{row2.sw.toString()&&<div className={`cicle ${row2.sw===0?"error-cicle":"success-cicle"}`}></div>}</StyledTableCell>
                                                                <StyledTableCell
                                                                    align="left">{row2.min}</StyledTableCell>
                                                                <StyledTableCell
                                                                    align="left">{row2.avg}</StyledTableCell>
                                                                <StyledTableCell
                                                                    align="left">{row2.max}</StyledTableCell>
                                                            </StyledTableRow>
                                                        )
                                                    })
                                                    }
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>}
                                </Typography>
                            })}

                        </div>
                    </Grid>
                    <Grid item xs={4} className={'right-content'}>
                        <div className={'rightTop'}>
                            <div >
                                <h4 className={'total'}><ViewQuiltIcon /><span>抽屉总数 : {slectDrawers}</span></h4>
                                <h4 className={'total'}><SelectAllIcon /><span>测试总数 : {testTBoxCount}</span></h4>
                                <h4 className={'failure'}><ErrorOutlineIcon/>异常总数 : <span>{this.state.testTBoxFailureCount}</span></h4>
                                <h4 className={'total'}><AccessAlarmIcon/><span>剩余时间 : <span>{this.timeStamp(this.state.leftTime)}</span></span></h4>

                            </div>
                        </div>
                        <div className="test-page">
                            <div className="drivers">
                                <p className={'title'} >CAN设备:</p>
                                <div className={'formContent'}>
                                    <FormControl style={{width: '65%'}}>
                                        <Select
                                            className={'library-select'}
                                            style={{width: '100%'}}
                                            disabled={this.state.isTesting}
                                            value={this.state.selectDriver}
                                            onChange={this.handleChangeSelect}
                                        >
                                            {this.state.drivers.map((item, index) => {
                                                return <MenuItem key={index} value={item.library}>{item.name}</MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </div>
                            </div>
                            <div className="drivers">
                                <p className={'title'}>测试时长: </p>
                                <div className={'formContent'}>
                                    <FormControl style={{width: '65%'}}>
                                        <TextField
                                            id="filled-error"
                                            type="number"
                                            value={this.state.testDuring}
                                            disabled={this.state.isTesting}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">(分钟)</InputAdornment>,
                                            }}
                                            onChange={(event)=>{
                                                if(event.target.value<0){
                                                    ipcRenderer.send('open-dialog', {
                                                        type: "error",
                                                        title: "Error",
                                                        message: '持续时间必须大于0'
                                                    });
                                                }else{
                                                    this.setState({
                                                        testDuring:event.target.value
                                                    })
                                                }}

                                            }
                                        />
                                    </FormControl>
                                </div>
                            </div>
                        {/*    <div className="drivers">
                                <p className={'title'} style={{marginTop: '6px'}}>选择抽屉 <span
                                    style={{fontSize: '14px', color: '#3f51b5'}}>括号数字表示已选T-Box个数

                                </span>
                                    <Checkbox
                                        checked={this.state.checkedAllTbox}
                                        onChange={this.handleCheckedAllTbox}
                                        disabled={this.state.isTesting}
                                    /></p>
                                <div style={{marginTop: '12px'}} className={'drawers'}>
                                    {
                                        this.state.drawers.map((item, index) => {
                                            let selectTBoxLenght = filter(item.tBox, (o) => {
                                                return o.checked
                                            }).length;
                                            return (
                                                <Button
                                                    key={index}
                                                    style={{width: '91px'}}
                                                    onClick={() => {
                                                        this.setState({
                                                            nowDrawer: index,
                                                            selectTBox: true,
                                                        })
                                                    }}
                                                    variant="contained" size={"small"} disabled={this.state.isTesting}>
                                                    {item.name} <span style={{
                                                    color: 'blue',
                                                    marginLeft: '3px'
                                                }}>({selectTBoxLenght})</span>
                                                </Button>
                                            )
                                        })
                                    }
                                </div>
                            </div>*/}
                            <div  style={{marginTop: '12px'}}>
                                <Button variant="contained" color="primary"
                                        disabled={this.state.isTesting}
                                        style={{marginRight: '12px',marginBottom: '12px'}}
                                        title={'ctrl+d 快捷键可以开始测试'}
                                        onClick={() => {
                                            if (!this.state.selectDriver) {
                                                ipcRenderer.send('open-dialog', {
                                                    type: "error",
                                                    title: "Error",
                                                    message: '请先选择驱动'
                                                });
                                                return
                                            }
                                            let afterFilter = filter(this.state.drawers, o => {
                                                let exitTBoxfilter = filter(o.tBox, i => {
                                                    return i.checked
                                                })
                                                return exitTBoxfilter.length > 0
                                            });
                                            console.log('afterFilter', afterFilter)
                                            if (afterFilter.length === 0) {
                                                ipcRenderer.send('open-dialog', {
                                                    type: "error",
                                                    title: "Error",
                                                    message: '请先选择T-Box'
                                                });
                                                return
                                            }
                                            this.setState({
                                                dialogOpen: true,
                                                selectedDrawers: afterFilter
                                            })
                                        }} startIcon={<PlayCircleFilledWhiteIcon/>}>
                                    开始测试(ctrl+d)
                                </Button>
                                <Button
                                    title={'ctrl+e 快捷键可以导出CSV'}
                                    style={{marginBottom: '12px'}}

                                    disabled={this.state.isTesting} variant="contained" color="primary"
                                    onClick={this.exportCSV}
                                    startIcon={<SaveIcon/>}>
                                    导出CSV(ctrl+e)
                                </Button>

                                {this.state.isTesting &&
                                <div >
                                    <Button variant="contained" color="secondary"
                                            onClick={() => {
                                                if(this.timer){
                                                    clearTimeout(this.timer)
                                                }
                                                if(this.timerOfLeft){
                                                    clearInterval(this.timerOfLeft)
                                                    this.timerOfLeft=null
                                                }

                                                ipcRenderer.send('stopTest');
                                            }} startIcon={<CancelScheduleSendIcon/>}>
                                        结束测试
                                    </Button>
                                </div>

                                }

                            </div>
                        </div>
                    </Grid>
                </Grid>

                <Snackbar open={this.state.errorOpen} anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                          autoHideDuration={6000} onClose={() => {
                    this.setState({
                        errorOpen: false
                    })
                }}>
                    <Alert severity="error">打开驱动{this.state.errorName}失败</Alert>
                </Snackbar>
                <Snackbar open={this.state.exportOpen} anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                          autoHideDuration={6000} onClose={() => {
                    this.setState({
                        exportOpen: false
                    })
                }}>
                    <Alert severity="success">保存CSV成功</Alert>
                </Snackbar>
                <Dialog
                    open={this.state.dialogOpen}
                    onClose={() => {
                        this.setState({
                            dialogOpen: false
                        })
                    }}
                >
                    <DialogTitle>{"确定开始测试吗? "}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            请勿中途关闭应用 , 否则会发生不可预测错误 !
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            this.setState({
                                dialogOpen: false
                            })
                        }} color="secondary">
                            取消
                        </Button>
                        <Button onClick={this.startTest} color="primary" autoFocus>
                            开始
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={this.state.selectTBox}
                    onClose={() => {
                        this.setState({
                            selectTBox: false
                        })
                    }}
                >
                    <DialogTitle>选择"{this.state.drawers[this.state.nowDrawer] && this.state.drawers[this.state.nowDrawer].name}"T-Box
                        <Checkbox
                            disabled={this.state.isTesting}
                            checked={this.state.drawers[this.state.nowDrawer] && this.state.drawers[this.state.nowDrawer].checkedAllTBox}
                            onChange={() => this.checkedAll()}
                            color="primary"
                        />
                    </DialogTitle>
                    <DialogContent>
                        <FormGroup row className={'checkForm'}>

                            {
                                this.state.drawers[this.state.nowDrawer] && this.state.drawers[this.state.nowDrawer].tBox.map((item, index) => {
                                    return <FormControlLabel
                                        key={index}
                                        labelPlacement="bottom"
                                        control={
                                            <Checkbox
                                                disabled={this.state.isTesting}
                                                checked={item.checked}
                                                onChange={() => this.handleChangeTBoxCheck(index)}
                                                value={item.key}
                                                color="primary"
                                            />
                                        }
                                        label={item.name}
                                    />
                                })
                            }
                        </FormGroup>
                    </DialogContent>
                </Dialog>
                <Drawer anchor="right" open={this.state.drawerOpen} onClose={() => {
                    this.setState({
                        drawerOpen: !this.state.drawerOpen
                    })
                }}>
                    <div className={'reactJson-box'}>
                        <ReactJson displayDataTypes={false} src={this.state.setting} theme="monokai" name={false}/>
                    </div>
                </Drawer>
            </div>

        );
    }
}

export default App;
