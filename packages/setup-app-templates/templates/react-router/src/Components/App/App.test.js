import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router';
import createBrowserHistory from 'history/createBrowserHistory';

import App from './';

const history = createBrowserHistory();

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Router history={history}>
      <App />
    </Router>,
    div
  );
});
