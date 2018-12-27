import React from 'react';
import ReactDOM from 'react-dom';

import App from './Components/App';
import registerServiceWorker from './registerServiceWorker';
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
