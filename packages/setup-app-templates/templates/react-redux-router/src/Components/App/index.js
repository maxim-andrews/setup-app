import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router';
import { NavLink } from 'react-router-dom';

import Spin from '../Spin';
import Blink from '../Blink';
import styles from './App.css';

class App extends Component {
  render() {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <nav>
            <ul>
              <li><NavLink to="/spin" activeClassName={styles.active}>Spin</NavLink></li>
              <li><NavLink to="/blink" activeClassName={styles.active}>Blink</NavLink></li>
            </ul>
          </nav>
          <div className={styles.logoSloganHolder}>
            <Switch>
              <Redirect exact from="/" to="/spin"/>
              <Route path="/spin" component={Spin} />
              <Route path="/blink" component={Blink} />
            </Switch>
            <h2>Welcome to React & Redux & Router setup by <code>setup-app</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
