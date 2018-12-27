import React, { Component } from 'react';

import SpinLogo from '../SpinLogo';
import styles from './App.css';

class App extends Component {
  render() {
    return (
      <div className={styles.bodyHolder}>
        <div className={styles.header}>
          <div className={styles.logoSloganHolder}>
            <SpinLogo type="React" />
            <SpinLogo type="Redux" />
            <h2>Welcome to React & Redux setup by <code>setup-app</code></h2>
          </div>
        </div>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
