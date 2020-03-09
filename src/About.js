import React, {PureComponent, Fragment} from 'react';
import './App.css';
const {ipcRenderer} = window.electron;
class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        console.log('componentDidMount in about')
        console.log(this.props)
        ipcRenderer.on('ping', function(event, message) {
            console.log('主页接受到主进程发送过来的消息',message);  // Prints "whoooooooh!"
        });
    }

    render() {
        return (
            <div>
                about
            </div>

        );
    }
}

export default App;
