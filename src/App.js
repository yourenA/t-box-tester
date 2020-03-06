import React, {PureComponent, Fragment} from 'react';
import logo from './logo.svg';
import stats from './067-stats.png';
import lottery from './130-lottery.png';
import './App.css';
import Home from './Home.js';
import Pre from './Pre.js';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    useHistory
} from "react-router-dom";

class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    componentDidMount() {
    }
    render() {
        return (
            <Router>
                <div>
                    <Switch>
                        <Route exact path="/"  component={Home}>
                        </Route>
                        <Route path="/pre"  component={Pre}>
                        </Route>
                    </Switch>
                </div>
            </Router>

        );
    }
}

export default App;
