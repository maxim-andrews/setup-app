import React from 'react';
import ReactDOM from 'react-dom';

import registerServiceWorker from './registerServiceWorker';
import App from './Components/App';
import './index.css';

function render(Component) {
  ReactDOM.render(<Component />, document.getElementById('root'));
}

render(App);

if(module.hot) {
  module.hot.accept('./Components/App', () => {
    const App = require('./Components/App').default;
    render(App);
  });
}

registerServiceWorker();
