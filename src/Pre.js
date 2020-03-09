import React, {PureComponent, Fragment} from 'react';
import './App.css';
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
import Chip from '@material-ui/core/Chip';
const {ipcRenderer} = window.electron;
function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            drivers:[],
            errorOpen:false,
            errorName:'',
            tBox:[{name:'T-Box-1'},{name:'T-Box-2'},{name:'T-Box-3'},{name:'T-Box-4'},{name:'T-Box-5'}
            ,{name:'T-Box-6'},{name:'T-Box-7'},{name:'T-Box-8'}]
        };
    }

    componentDidMount() {
        console.log('componentDidMount in pre')
        const that=this;
        ipcRenderer.send('getDrivers')
        ipcRenderer.on('getDriversFromMain', function(event, message) {
            console.log('获取到的驱动',message)
            for(let i=0;i<message.length;i++){
                message[i].checked=false
            }
            that.setState({
                drivers:message,
            })
        });
        ipcRenderer.on('openDriversFromMain', function(event, openResult,index,item) {
            console.log('打开驱动',openResult,index,item)
            if(openResult===0){
                for(let i=0;i<that.state.drivers.length;i++){
                    if(i==index){
                        that.state.drivers[i].checked=!that.state.drivers[i].checked;
                        that.setState({
                            drivers:[...that.state.drivers],
                        })
                    }
                }
            }else{
                that.setState({
                    errorOpen:true,
                    errorName:item.name
                })

            }
        });

    }
    handleChangeCheck=(index,item)=>{
        const that=this;
        if(item.checked){
            console.log('已经打开驱动')
            for(let i=0;i<that.state.drivers.length;i++){
                if(i==index){
                    that.state.drivers[i].checked=!that.state.drivers[i].checked;
                    that.setState({
                        drivers:[...that.state.drivers],
                    })
                }
            }
        }else{
            ipcRenderer.send('openDrivers',index,item);
        }



    }
    render() {
        return (
            <div>
                <AppBar position="fixed">
                    <Toolbar>
                        <IconButton onClick={()=>{
                            this.props.history.goBack()
                        }} edge="start" color="inherit" aria-label="menu">
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6">
                            老化抽屉预测试
                        </Typography>

                    </Toolbar>
                </AppBar>
                <div className="test-page">
                        <div className="drivers">
                            <p className={'title'}>可选驱动</p>
                            <div style={{marginTop:'12px'}}>
                                { this.state.drivers.map((item,index)=>{
                                    return(
                                        <Chip
                                            clickable
                                            onClick={()=>this.handleChangeCheck(index,item)}
                                            key={index}
                                            label={item.name}
                                            color={item.checked?"primary":"default"}
                                        />
                                    )
                                })}

                            </div>
                        {/*    <FormGroup row>
                                {
                                    this.state.drivers.map((item,index)=>{
                                        return     <FormControlLabel
                                            key={index}
                                            control={
                                                <Checkbox
                                                    onChange={()=>this.handleChangeCheck(index,item)}
                                                    checked={item.checked}
                                                    value={item.library}
                                                    color="primary"
                                                />
                                            }
                                            label={item.name}
                                        />
                                    })
                                }

                            </FormGroup>*/}
                        </div>
                    <Divider light/>
                    <div className="drivers">
                        <p className={'title'}>T-Box抽屉  <Checkbox
                            defaultChecked
                            color="primary"
                        /></p>
                         <FormGroup row>
                                {
                                    this.state.tBox.map((item,index)=>{
                                        return     <FormControlLabel
                                            key={index}
                                            labelPlacement="bottom"
                                            control={
                                                <Checkbox

                                                    value={item.name}
                                                    color="primary"
                                                />
                                            }
                                            label={item.name}
                                        />
                                    })
                                }
                       {
                           this.state.tBox.map((item,index)=>{
                               return     <FormControlLabel
                                   key={index}
                                   labelPlacement="bottom"
                                   control={
                                       <Checkbox

                                           value={item.name}
                                           color="primary"
                                       />
                                   }
                                   label={item.name}
                               />
                           })
                       }

                            </FormGroup>
                    </div>
                    <Divider light />
                </div>
                <Snackbar open={this.state.errorOpen}  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                          autoHideDuration={6000} onClose={()=>{
                    this.setState({
                        errorOpen:false
                    })
                }}>
                    <Alert severity="error">打开驱动{this.state.errorName}失败</Alert>
                </Snackbar>
            </div>

        );
    }
}

export default App;
