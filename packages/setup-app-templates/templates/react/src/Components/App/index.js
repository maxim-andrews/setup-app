import React, { Component } from 'react';
import logo from './logo.svg';
import styles from './App.css';

class App extends Component {
  render() {
    return (
      <div className={styles.bodyHolder}>
        <div className={styles.header}>
          <div className={styles.logoSloganHolder}>
            <img src={logo} className={styles.logo} alt="React Logo" />
            <h2>Welcome to simple React setup by <code>setup-app</code></h2>
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
