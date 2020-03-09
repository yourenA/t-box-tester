import React, {PureComponent, Fragment} from 'react';
import logo from './logo.svg';
import stats from './067-stats.png';
import lottery from './130-lottery.png';
import './App.css';
import Home from './Home.js';
import About from './About.js';
import Pre from './Pre.js';

import {
    Switch,
    Route,
} from "react-router-dom";

class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    componentDidMount() {
        console.log('componentDidMount in app')
    }
    render() {
        return (
                <div>
                    <Switch>
                        <Route exact path="/"  component={Home}>
                        </Route>
                        <Route path="/pre"  component={Pre}>
                        </Route>
                        <Route path="/about"  component={About}>
                        </Route>
                    </Switch>
                </div>

        );
    }
}

export default App;
