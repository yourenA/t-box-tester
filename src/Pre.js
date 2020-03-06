import React, {PureComponent, Fragment} from 'react';
import stats from './067-stats.png';
import lottery from './130-lottery.png';
import './App.css';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    useHistory
} from "react-router-dom";
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/ArrowBack';
const {ipcRenderer} = window.electron;
class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        ipcRenderer.on('ping', function(event, message) {
            console.log('测试页接受到主进程发送过来的消息',message);  // Prints "whoooooooh!"
        });
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
                </div>

            </div>

        );
    }
}

export default App;
