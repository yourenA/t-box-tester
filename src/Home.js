import React, {PureComponent, Fragment} from 'react';
import stats from './067-stats.png';
import lottery from './130-lottery.png';
import './App.css';
const {ipcRenderer} = window.electron;
class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        ipcRenderer.on('ping', function(event, message) {
            console.log('主页接受到主进程发送过来的消息',message);  // Prints "whoooooooh!"
        });
    }

    render() {
        return (
            <div>
                <div className="App">
                    <header className="App-header">
                        <div className='item' onClick={() => {
                            this.props.history.push("/pre");
                        }}>
                            <img src={lottery} className="App-logo" alt="logo"/>
                            <p>
                                老化抽屉预测试
                            </p>

                        </div>
                        <div className='item'>
                            <img src={stats} className="App-logo" alt="logo"/>
                            <p>
                                老化测试
                            </p>

                        </div>
                    </header>
                </div>
            </div>

        );
    }
}

export default App;
