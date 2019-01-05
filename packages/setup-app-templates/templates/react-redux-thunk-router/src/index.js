import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';

import App from './Components/App';
import configureStore from './Store/ConfigureStore';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const  { history, store } = configureStore();

function render(Component, firstRender) {
  const rootNode = document.getElementById('root');
  const renderMethod =
    firstRender === true && rootNode.hasChildNodes()
      ? ReactDOM.hydrate
      : ReactDOM.render;

  renderMethod(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Component />
      </ConnectedRouter>
    </Provider>,
    rootNode
  );
}

render(App, true);

if(module.hot) {
  module.hot.accept('./Components/App', () => {
    const App = require('./Components/App').default;
    render(App);
  });
}

registerServiceWorker();

/* ,
"devRewrite": {
  "regexp": "^\\/(spin|blink)$"
} */
