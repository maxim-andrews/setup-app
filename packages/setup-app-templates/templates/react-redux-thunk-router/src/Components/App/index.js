import React from 'react';
// kra-mod-start
/* eslint-disable import/first */
if (KRA.ROUTER) {
  import { Route, Switch, Redirect } from 'react-router';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.BACKEND && KRA.ROUTER && KRA.REDUX) {
  import Spin from '../Spin';
  import Blink from '../Blink';
  import RouterNav from '../RouterNav';
  import ServerFetch from '../ServerFetch';
} else if (KRA.BACKEND && KRA.ROUTER) {
  import SpinLogo from '../SpinLogo';
  import Blink from '../Blink';
  import RouterNav from '../RouterNav';
  import ServerFetch from '../ServerFetch';
} else if (KRA.BACKEND && KRA.REDUX) {
  import Spin from '../Spin';
  import ServerFetch from '../ServerFetch';
} else if (KRA.REDUX && KRA.ROUTER) {
  import Spin from '../Spin';
  import Blink from '../Blink';
  import RouterNav from '../RouterNav';
} else if (KRA.ROUTER) {
  import SpinLogo from '../SpinLogo';
  import Blink from '../Blink';
  import RouterNav from '../RouterNav';
} else if (KRA.BACKEND) {
  import SpinLogo from '../SpinLogo';
  import ServerFetch from '../ServerFetch';
} else if (KRA.REDUX) {
  import Spin from '../Spin';
} else {
  import SpinLogo from '../SpinLogo';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.SASS && KRA.LESS && KRA.POSTCSS) {
  import sass from './sass-less-post/App.scss'; // kra-mod-replace /sass-less-post
  import less from './sass-less-post/App.less'; // kra-mod-replace /sass-less-post
  import postcss from './sass-less-post/App.css'; // kra-mod-replace /sass-less-post

  const styles = Object.assign(sass, less, postcss);
} else if (KRA.SASS && KRA.LESS) {
  import less from './sass-less/App.less'; // kra-mod-replace /sass-less
  import sass from './sass-less/App.scss'; // kra-mod-replace /sass-less

  const styles = Object.assign(less, sass);
} else if (KRA.LESS && KRA.POSTCSS) {
  import less from './less-post/App.less'; // kra-mod-replace /less-post
  import postcss from './less-post/App.css'; // kra-mod-replace /less-post

  const styles = Object.assign(less, postcss);
} else if (KRA.SASS && KRA.POSTCSS) {
  import sass from './sass-post/App.scss'; // kra-mod-replace /sass-post
  import postcss from './sass-post/App.css'; // kra-mod-replace /sass-post

  const styles = Object.assign(sass, postcss);
} else if (KRA.SASS) {
  import styles from './App.scss';
} else if (KRA.LESS) {
  import styles from './App.less';
} else if (KRA.POSTCSS) {
  import styles from './App.post.css'; // kra-mod-replace .post
} else {
  import styles from './App.css';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
if (KRA.BACKEND && KRA.REDUX && KRA.ROUTER) {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <RouterNav />
          <div className={styles.logoSloganHolder}>
            <Switch>
              <Redirect exact from="/" to="/spin"/>
              <Route path="/spin" component={Spin} />
              <Route path="/blink" component={Blink} />
            </Switch>
            <h2>Welcome to React & Redux & Router setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
        <ServerFetch />
      </div>
    );
  }
} else if (KRA.REDUX && KRA.ROUTER) {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <RouterNav />
          <div className={styles.logoSloganHolder}>
            <Switch>
              <Redirect exact from="/" to="/spin"/>
              <Route path="/spin" component={Spin} />
              <Route path="/blink" component={Blink} />
            </Switch>
            <h2>Welcome to React & Redux & Router setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
      </div>
    );
  }
} else if (KRA.BACKEND && KRA.REDUX) {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <div className={styles.logoSloganHolder}>
            <Spin />
            <h2>Welcome to simple React & Redux setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
        <ServerFetch />
      </div>
    );
  }
} else if (KRA.BACKEND && KRA.ROUTER) {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <RouterNav />
          <div className={styles.logoSloganHolder}>
            <Switch>
              <Redirect exact from="/" to="/spin"/>
              <Route path="/spin" component={SpinLogo} />
              <Route path="/blink" component={Blink} />
            </Switch>
            <h2>Welcome to simple React & Router setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
        <ServerFetch />
      </div>
    );
  }
} else if (KRA.BACKEND) {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <div className={styles.logoSloganHolder}>
            <SpinLogo />
            <h2>Welcome to simple React setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
        <ServerFetch />
      </div>
    );
  }
} else if (KRA.REDUX) {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <div className={styles.logoSloganHolder}>
            <Spin />
            <h2>Welcome to simple React & Redux setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
      </div>
    );
  }
} else if (KRA.ROUTER) {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <RouterNav />
          <div className={styles.logoSloganHolder}>
            <Switch>
              <Redirect exact from="/" to="/spin"/>
              <Route path="/spin" component={SpinLogo} />
              <Route path="/blink" component={Blink} />
            </Switch>
            <h2>Welcome to simple React & Router setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
      </div>
    );
  }
} else {
  function App () {
    return (
      <div className={styles.bodyHolder}>
        <header>
          <div className={styles.logoSloganHolder}>
            <SpinLogo />
            <h2>Welcome to simple React setup by <code>KRA.js</code></h2>
          </div>
        </header>
        <p className={styles.intro}>
          To get started, edit <code>src/Components/App/index.js</code> and save to reload.
        </p>
      </div>
    );
  }
}
// kra-mod-end

export default App;
