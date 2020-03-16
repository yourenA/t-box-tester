import React, {PureComponent, Fragment} from 'react';
import './App.css';
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
import Divider from '@material-ui/core/Divider';
import MenuIcon from '@material-ui/icons/ArrowBack';
import CancelScheduleSendIcon from '@material-ui/icons/CancelScheduleSend';
import SaveIcon from '@material-ui/icons/Save';
import Grid from '@material-ui/core/Grid';
import {parseAsync} from 'json2csv';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite';
import BackupIcon from '@material-ui/icons/Backup';
import DescriptionIcon from '@material-ui/icons/Description';
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
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

const StyledTableCell = withStyles(theme => ({
    head: {
        backgroundColor:'#3f51b5',
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

class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            drivers: [],
            selectDriver: '',
            errorOpen: false,
            dialogOpen: false,
            startLoading:false,
            checkedAll: false,
            isTesting:false,
            drawerOpen:false,
            errorName: '',
            setting:{},
            tBox: [{name: 'T-Box-1', index: 1, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-2', index: 2,  sw: '',avg: '', max: '', checked: false},
                {name: 'T-Box-3', index: 3, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-4', index: 4, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-5', index: 5, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-6', index: 6, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-7', index: 7, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-8', index: 8, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-9', index: 9, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-10', index: 10, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-11', index: 11, sw: '', avg: '', max: '', checked: false},
                {name: 'T-Box-12', index: 12, sw: '', avg: '', max: '', checked: false},
            ]
        };
    }

    componentDidMount() {
        console.log('componentDidMount in pre')
        const that = this;
        ipcRenderer.send('getDrivers')
        ipcRenderer.send('getSetting')
        ipcRenderer.on('getSettingFromMain', function (event, setting) {
            that.setState({
                setting
            })


        });
        ipcRenderer.on('getDriversFromMain', function (event, message) {
            console.log('获取到的驱动', message)
            // let arg=[{
            //     library:'123',
            //     name:'驱动一'
            // },{
            //     library:'1236',
            //     name:'驱动二'
            // }]
            that.setState({
                drivers: message,
            })
        });
        ipcRenderer.on('openDriversFromMain', function (event,library) {
            console.log('打开驱动', library)
            that.setState({
                selectDriver: library,
            })
            // if (openResult === 0) {
            //     that.setState({
            //         selectDriver: library,
            //     })
            //     ipcRenderer.send('open-dialog', {
            //         type: "info",
            //         title: "Success",
            //         message: '打开驱动成功'
            //     });
            // } else {
            // }
        });

        ipcRenderer.on('exportCSVFromMain', (event, message) => {
            let ops = ['name', 'sw', 'avg', 'max'];
            let csvContent =[];
            for(let i=0;i<that.state.tBox.length;i++){
                if(that.state.tBox[i].checked){
                    csvContent.push({
                        name:that.state.tBox[i].name,
                        sw:that.state.tBox[i].sw,
                        avg:that.state.tBox[i].avg,
                        max:that.state.tBox[i].max,
                    })
                }
            }
            console.log('csvContent',csvContent)
            parseAsync(csvContent, {ops}).then(csv => {
                fs.writeFile(message, csv, err => {
                    if (err) {
                        console.log('err',err)
                        ipcRenderer.send('open-dialog', {
                            type: "error",
                            title: "Error",
                            message: err.toString()
                        });
                        return false
                    };
                    console.log('导出成功')
                    ipcRenderer.send('open-dialog', {
                        type: "info",
                        title: "Success",
                        message: '导出CSV成功'
                    });
                });
            }).catch(err => console.error(err));
        })

        ipcRenderer.on('sendInfoFromMain', (event, item) => {
            for(let i=0;i<that.state.tBox.length;i++){
                if(that.state.tBox[i].index===item.index){
                    that.state.tBox[i].sw=item.sw;
                    that.state.tBox[i].avg=item.avg;
                    that.state.tBox[i].max=item.max;
                    that.setState({
                        tBox:[...that.state.tBox]
                    })
                }
            }
        })
        ipcRenderer.on('changeStart', (event,bool) => {
            console.log('bool',bool)
            that.setState({
                isTesting:bool
            })
        })



    }

    handleChangeSelect = (event) => {
        console.log(event)
        if(this.state.selectDriver===event.target.value){
            console.log('没有改变')
            return false
        }

        ipcRenderer.send('openDrivers', event.target.value);
    }

    handleChangeTBoxCheck = (index) => {

        for (let i = 0; i < this.state.tBox.length; i++) {
            if (index === i) {
                this.state.tBox[i].checked = !this.state.tBox[i].checked;
                this.setState({
                    tBox: [...this.state.tBox]
                }, function () {
                    this.checkedAllState()
                })
            }
        }

    }
    exportCSV = () => {
        try {
            ipcRenderer.send('exportCSV');
        } catch (err) {
            console.error(err);
        }
    }
    openFile = () => {
        ipcRenderer.send('openFile');
    }
    checkedAll = () => {
        this.setState({
            checkedAll: !this.state.checkedAll,
        }, function () {
            if (this.state.checkedAll) {
                for (let i = 0; i < this.state.tBox.length; i++) {
                    this.state.tBox[i].checked = true;

                }
            } else {
                for (let i = 0; i < this.state.tBox.length; i++) {
                    this.state.tBox[i].checked = false;

                }
            }
            this.setState({
                tBox: [...this.state.tBox]
            })
        })

    }
    checkedAllState = () => {
        let all = true
        for (let i = 0; i < this.state.tBox.length; i++) {
            if (!this.state.tBox[i].checked) {
                all = false
            }
        }
        this.setState({
            checkedAll: all
        })
    }
    startTest = () => {
        for(let i=0;i<this.state.tBox.length;i++){
            this.state.tBox[i].sw=''
            this.state.tBox[i].avg=''
            this.state.tBox[i].max=''
        }
        this.setState({
            tBox:[...this.state.tBox]
        })
        let afterFilter = filter(this.state.tBox, o => {
            return o.checked
        });
        let tbox = []
        for (let i = 0; i < afterFilter.length; i++) {
            tbox.push(afterFilter[i].index)
        }
        this.setState({
            dialogOpen: false,
            // startLoading: true,
            isTesting:true,
        },function () {
            ipcRenderer.send('startTest', tbox);
        })
    }

    render() {

        return (
            <div>
                <AppBar position="fixed">
                    <Toolbar>
                        <IconButton onClick={() => {
                            this.props.history.goBack()
                        }} edge="start" color="inherit" aria-label="menu">
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6">
                            老化抽屉预测试
                        </Typography>

                    </Toolbar>
                </AppBar>
                <Grid container spacing={3} className={'pre-box'}>
                    <Grid item xs={8}>
                        <div className={'table-content'}>
                            <TableContainer style={{maxHeight: ' calc(100vh - 88px)', border: '1px solid #333'}}>
                                <Table  stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell>
                                                <Checkbox
                                                    checked={this.state.checkedAll}
                                                    onChange={this.checkedAll}
                                                    disabled={this.state.isTesting}
                                                />
                                            </StyledTableCell>
                                            <StyledTableCell>名称</StyledTableCell>
                                            <StyledTableCell align="left">电源开关状态</StyledTableCell>
                                            <StyledTableCell align="left">平均电流</StyledTableCell>
                                            <StyledTableCell align="left">峰值电流</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {this.state.tBox.map((row,index) => (
                                            <StyledTableRow className={`${row.checked ? 'table-checked' : ''}  ${Number(row.sw)>8 ? 'error-row' : ''}`}
                                                            role="checkbox" key={row.name}>
                                                <StyledTableCell padding="checkbox">
                                                    <Checkbox
                                                        disabled={this.state.isTesting}
                                                        checked={row.checked}
                                                        onChange={() => this.handleChangeTBoxCheck(index)}
                                                        value={row.index}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell component="th" scope="row">
                                                    {row.name}
                                                </StyledTableCell>
                                                <StyledTableCell align="left">{row.sw}</StyledTableCell>
                                                <StyledTableCell align="left">{row.avg}</StyledTableCell>
                                                <StyledTableCell align="left">{row.max}</StyledTableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <div className="drivers" style={{marginTop: '12px',float:'right'}}>
                                <Button      disabled={this.state.isTesting} variant="contained" color="primary" onClick={this.exportCSV}
                                             startIcon={<SaveIcon/>}>
                                    导出CSV
                                </Button>
                            </div>
                        </div>
                    </Grid>
                    <Grid item xs={4}>
                        <div className="test-page">
                            <div className="drivers">
                                <p className={'title'}>当前参数</p>
                                <div style={{marginTop: '12px'}}>
                                    <Button size="small"
                                            style={{marginRight: '12px'}}
                                            onClick={()=>{
                                                this.setState({
                                                    drawerOpen:!this.state.drawerOpen
                                                })
                                            }}
                                            disabled={this.state.isTesting}
                                            startIcon={<DescriptionIcon/>}>
                                        查看当前配置
                                    </Button>
                                    <Button size="small" variant="contained" color="primary"
                                            onClick={this.openFile}
                                            disabled={this.state.isTesting}
                                            startIcon={<BackupIcon/>}>
                                        上传本地配置文件
                                    </Button>
                                </div>
                            </div>
                            <Divider light/>
                            <div className="drivers">
                                <p className={'title'}  style={{marginTop:'6px'}}>可选驱动</p>
                                <div style={{marginTop: '12px'}}>
                                    <FormControl   style={{width:'100%'}}>
                                        <Select
                                            className={'library-select'}
                                            style={{width:'100%'}}
                                            disabled={this.state.isTesting}
                                            value={this.state.selectDriver}
                                            onChange={this.handleChangeSelect}
                                        >
                                            {this.state.drivers.map((item, index) => {
                                                return  <MenuItem key={index} value={item.library}>{item.name}</MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </div>
                            </div>
                            {/*<div className="drivers">
                                <p className={'title'}>T-Box抽屉 <Checkbox
                                    checked={this.state.checkedAll}
                                    onChange={this.checkedAll}
                                    disabled={this.state.isTesting}
                                    color="primary"
                                /></p>
                                <FormGroup row className={'checkForm'}>
                                    {
                                        this.state.tBox.map((item, index) => {
                                            return <FormControlLabel
                                                key={index}
                                                labelPlacement="bottom"
                                                control={
                                                    <Checkbox
                                                        disabled={this.state.isTesting}
                                                        checked={item.checked}
                                                        onChange={() => this.handleChangeTBoxCheck(index)}
                                                        value={item.index}
                                                        color="primary"
                                                    />
                                                }
                                                label={item.name}
                                            />
                                        })
                                    }

                                </FormGroup>
                            </div>
                            <Divider light/>*/}

                            <div className="drivers" style={{marginTop: '12px'}}>
                                <Button variant="contained" color="primary"
                                        disabled={this.state.isTesting}
                                        style={{marginRight: '12px'}}
                                        onClick={() => {
                                    if (!this.state.selectDriver) {
                                        ipcRenderer.send('open-dialog', {
                                            type: "error",
                                            title: "Error",
                                            message: '请先选择驱动'
                                        });
                                        return
                                    }
                                    let afterFilter = filter(this.state.tBox, o => {
                                        return o.checked
                                    });
                                    if (afterFilter.length === 0) {
                                        ipcRenderer.send('open-dialog', {
                                            type: "error",
                                            title: "Error",
                                            message: '请先选择T-Box'
                                        });
                                        return
                                    }
                                    this.setState({
                                        dialogOpen: true
                                    })
                                }} startIcon={<PlayCircleFilledWhiteIcon/>}>
                                    开始测试
                                </Button>
                                {
                                    this.state.isTesting
                                    &&
                                    <Button variant="contained" color="secondary"
                                            onClick={() => {
                                                ipcRenderer.send('stopTest');
                                            }} startIcon={<CancelScheduleSendIcon/>}>
                                        结束测试
                                    </Button>
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
                        {/*   <Button onClick={() => {

                            let win = new BrowserWindow({
                                width: 1300,
                                height: 700,
                                minHeight: 700,
                                center: true,
                                webPreferences: {
                                    devTools: true, //是否开启 DevTools
                                    nodeIntegration: true
                                },
                                show: true,
                                parent: window.electron.remote.getCurrentWindow(),
                                modal: true,
                            })
                            win.loadURL(window.location.protocol + "//" + window.location.host + '#/about?name=10386')
                            win.on('closed', function () {
                                win = null
                            })
                        }} color="primary" autoFocus>
                            开始
                        </Button>*/}
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={this.state.startLoading}
                    onClose={() => {
                    }}
                    className={'null-dialog'}
                >
                    <DialogContent>
                        <span>正在测试...</span>
                    </DialogContent>

                </Dialog>
                <Drawer anchor="right" open={this.state.drawerOpen} onClose={()=>{
                    this.setState({
                        drawerOpen:!this.state.drawerOpen
                    })
                }}>
                    <div className={'reactJson-box'}>
                        <ReactJson  displayDataTypes={false}  src={this.state.setting} theme="monokai" name={false}/>
                    </div>
                </Drawer>
            </div>

        );
    }
}

export default App;
