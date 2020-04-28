import React, {PureComponent, Fragment} from 'react';
import stats from './067-stats.png';
import lottery from './130-lottery.png';
import logo from './logo.png';
import './App.css';
import Drawer from "@material-ui/core/Drawer";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from '@material-ui/icons/Settings';
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
const {ipcRenderer} = window.electron;
class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            setting:{
                version:'',
                url:''
            }
        };
    }

    componentDidMount() {
        console.log('ipcRenderer',ipcRenderer)
        console.log('componentDidMount in home');
        let setting=localStorage.getItem('setting');
        if(setting){
            this.setState({
                setting:JSON.parse(setting)
            },function () {
                ipcRenderer.send('setSetting',this.state.setting);
            })

        }else{
            const originData={
                "limit_max": 850,
                "limit_min": 800,
                "pre_interval": 2,
                "nor_interval": 30,
                "nor_duration": 120
            }
            localStorage.setItem('setting',JSON.stringify(originData))
            this.setState({
                setting:originData
            },function () {
                ipcRenderer.send('setSetting',this.state.setting);
            })
        }
        const that=this;
        ipcRenderer.send('getVersion');
        ipcRenderer.on('getVersionFromMain',(event, version) => {
            console.log('version', version)
            that.setState({
                version:version
            })
        });

        let defaultPath=localStorage.getItem('defaultPath');
        if(defaultPath){
            this.setState({
                url:defaultPath
            })
            ipcRenderer.send('getDefaultPath',defaultPath);
        }else{
            // ipcRenderer.send('getURL');
        }
        // ipcRenderer.on('getExePathFromMain', function (event, exePath) {
        //     console.log('exePath', exePath);
        //     that.setState({
        //         url:exePath
        //     })
        // });
        ipcRenderer.on('changeURLFromMain', function (event, path) {
            console.log('path', path);
            that.setState({
                url:path,
            })
            localStorage.setItem('defaultPath',path);
            ipcRenderer.send('getDefaultPath',path);
            ipcRenderer.send('open-dialog', {
                type: "info",
                title: "Success",
                message: '更改自动导出目录成功'
            });
        });

    }
    onChange=(event,type)=>{
        this.setState({
            setting:{
                ...this.state.setting,
                [type]:Number(event.target.value)
            }
        })
    }
    saveSetting=()=>{
        for(let key in this.state.setting){
            if(!Boolean(this.state.setting[key]) || this.state.setting[key]<=0){
                ipcRenderer.send('open-dialog', {
                    type: "error",
                    title: "Error",
                    message: '设置数值必须大于0'
                });
                return false
            }
        }
        console.log(this.state.setting);
        localStorage.setItem('setting',JSON.stringify(this.state.setting));
        ipcRenderer.send('setSetting',this.state.setting);
        ipcRenderer.send('open-dialog', {
            type: 'info',
            title: 'Success',
            message: '保存设置成功.',
        });
    }
    selectUrl=()=>{
        ipcRenderer.send('openDefaultURL',this.state.url);
    }
    render() {
        return (
            <div>
                <div className="App">
                    <div className="project-name">
                       广州华望-TBox老化测试系统-V{this.state.version}
                    </div>
                    <div className="setting">

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
                    </div>
                    <header className="App-header">
                        <div className='item' onClick={() => {
                            this.props.history.replace("/pre");
                        }}>
                            <img src={lottery} className="App-logo" alt="logo"/>
                            <p>
                                预测试
                            </p>

                        </div>
                        <div className='item'
                             onClick={() => {
                                 this.props.history.replace("/formal");
                             }}>
                            <img src={stats} className="App-logo" alt="logo"/>
                            <p>
                                老化测试
                            </p>

                        </div>
                    </header>
                </div>
                <Drawer anchor="right" open={this.state.drawerOpen} onClose={() => {
                    this.setState({
                        drawerOpen: !this.state.drawerOpen
                    })
                }}>
                    <div className={'drawer-content'}>
                        <div className="drivers">
                            <p className={'title'} style={{width:'110px',textAlign:'right'}}>limit_max : </p>
                            <div className={'formContent'}>
                                <FormControl >
                                    <TextField
                                        type="number"
                                        value={this.state.setting.limit_max?Number(this.state.setting.limit_max):0}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">(mA)</InputAdornment>,
                                        }}
                                        onChange={(event)=>{this.onChange(event,'limit_max') }}
                                    />
                                </FormControl>

                            </div>
                        </div>
                        <div className="drivers">
                            <p className={'title'}  style={{width:'110px',textAlign:'right'}}>limit_min : </p>
                            <div className={'formContent'}>
                                <FormControl >
                                    <TextField
                                        type="number"
                                        value={this.state.setting.limit_min?Number(this.state.setting.limit_min):0}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">(mA)</InputAdornment>,
                                        }}
                                        onChange={(event)=>{this.onChange(event,'limit_min') }}
                                    />
                                </FormControl>

                            </div>
                        </div>
                        <div className="drivers">
                            <p className={'title'}  style={{width:'110px',textAlign:'right'}}>pre_interval : </p>
                            <div className={'formContent'}>
                                <FormControl >
                                    <TextField
                                        type="number"
                                        value={this.state.setting.pre_interval?Number(this.state.setting.pre_interval):0}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">(秒)</InputAdornment>,
                                        }}
                                        onChange={(event)=>{this.onChange(event,'pre_interval') }}
                                    />
                                </FormControl>

                            </div>
                        </div>
                        <div className="drivers">
                            <p className={'title'}  style={{width:'110px',textAlign:'right'}}>nor_interval : </p>
                            <div className={'formContent'}>
                                <FormControl >
                                    <TextField
                                        type="number"
                                        value={this.state.setting.nor_interval?Number(this.state.setting.nor_interval):0}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">(秒)</InputAdornment>,
                                        }}
                                        onChange={(event)=>{this.onChange(event,'nor_interval') }}
                                    />
                                </FormControl>

                            </div>
                        </div>
                        <div className="drivers">
                            <p className={'title'}  style={{width:'110px',textAlign:'right'}}>nor_duration : </p>
                            <div className={'formContent'}>
                                <FormControl >
                                    <TextField
                                        type="number"
                                        value={this.state.setting.nor_duration?Number(this.state.setting.nor_duration):0}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">(分钟)</InputAdornment>,
                                        }}
                                        onChange={(event)=>{this.onChange(event,'nor_duration') }}
                                    />
                                </FormControl>

                            </div>
                        </div>

                        <Button
                            color={'primary'}
                            style={{width: '100%'}}
                            onClick={this.saveSetting}
                            variant="contained" size={"small"}
                        >
                            保存设置
                        </Button>
                        <div style={{marginTop:'15px'}}>
                            <p className={'title'} style={{display:'block'}} >自动导出CSV目录 : </p>
                            <div className={'formContent'} style={{width:'100%'}}>
                                <FormControl  style={{width:'100%'}}>
                                    <TextField
                                        readOnly
                                        style={{width:'100%',cursor:'pointer'}}
                                        value={this.state.url}
                                        onClick={this.selectUrl}
                                    />
                                </FormControl>

                            </div>
                        </div>
                    </div>
                </Drawer>
            </div>

        );
    }
}

export default App;
