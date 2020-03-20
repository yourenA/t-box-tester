import React, {PureComponent, Fragment} from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import './App.css';
import Home from './Home.js';
import Formal from './Formal.js';
import Pre from './Pre.js';

import {
    Switch,
    Route,
} from "react-router-dom";
const {ipcRenderer} = window.electron;
class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            updateDialog:false,
            updateMsg:'',
            canClose:false
        };
    }
    componentDidMount() {
        const that=this
        console.log('componentDidMount in app')
        ipcRenderer.on('updateMessage', function(event, msg) {
            that.setState({
                updateDialog:true,
                updateMsg:msg.message,
                canClose:msg.type==='error'||msg.type==='success'
            })
            console.log('updateMessage',msg.message);  // Prints "whoooooooh!"
        });
    }
    render() {
        return (
                <div>
                    <Switch>
                        <Route exact path="/"  component={Home}>
                        </Route>
                        <Route path="/pre"  component={Pre}>
                        </Route>
                        <Route path="/formal"  component={Formal}>
                        </Route>
                    </Switch>
                    <Dialog
                        open={this.state.updateDialog}
                        onClose={() => {
                            if(this.state.canClose){
                                this.setState({
                                    updateDialog:false
                                })
                            }
                        }}
                    >
                        <DialogContent style={{paddingTop:'8px'}}>
                            <span>
                                {this.state.updateMsg}
                            </span>
                        </DialogContent>

                    </Dialog>
                </div>

        );
    }
}

export default App;
