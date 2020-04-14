import React, {PureComponent, Fragment} from 'react';
import stats from './067-stats.png';
import lottery from './130-lottery.png';
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
            setting:{}
        };
    }

    componentDidMount() {
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
    }
    onChange=(event,type)=>{
        if(event.target.value<=0){
            ipcRenderer.send('open-dialog', {
                type: "error",
                title: "Error",
                message: '数值必须大于0'
            });
        }else{
            this.setState({
                setting:{
                    ...this.state.setting,
                    [type]:Number(event.target.value)
                }
            })
        }
    }
    saveSetting=()=>{
        localStorage.setItem('setting',JSON.stringify(this.state.setting));
        ipcRenderer.send('setSetting',this.state.setting);
    }
    render() {
        return (
            <div>
                <div className="App">
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
                    </div>
                </Drawer>
            </div>

        );
    }
}

export default App;
