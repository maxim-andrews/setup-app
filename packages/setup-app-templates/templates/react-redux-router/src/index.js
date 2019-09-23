import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';

import App from './Components/App';
import configureStore from './Store/ConfigureStore';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const  { history, store } = configureStore();

function render(Component) {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Component />
      </ConnectedRouter>
    </Provider>,
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
