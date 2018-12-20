import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router';
import createBrowserHistory from 'history/createBrowserHistory';

import App from './Components/App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const history = createBrowserHistory();

function render(Component) {
  ReactDOM.render(
    <Router history={history}>
      <Component />
    </Router>,
    document.getElementById('root')
  );
}

render(App);

if(module.hot) {
  module.hot.accept('./Components/App', () => {
    const App = require('./Components/App').default;
    render(App);
  });
}

registerServiceWorker();
