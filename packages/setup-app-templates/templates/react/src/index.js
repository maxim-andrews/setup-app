import React from 'react';
import ReactDOM from 'react-dom';
// kra-mod-start
/* eslint-disable import/first */
if (KRA.REDUX && KRA.ROUTER) {
  import { Provider } from 'react-redux';
  import { ConnectedRouter } from 'connected-react-router';
} else if (KRA.REDUX) {
  import { Provider } from 'react-redux';
} else if (KRA.ROUTER) {
  import { Router } from 'react-router';
  import { createBrowserHistory } from 'history';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.REDUX && KRA.CSR && KRA.SSR) {
  import initStore from './Store/initStore';
  import configureStore from './Store/ConfigureStore';
} else if (KRA.REDUX && KRA.CSR) {
  import initStore from './Store/initStore';
  import configureStore from './Store/ConfigureStore.csrOnly'; // kra-mod-replace .csrOnly
}
/* eslint-enable import/first */
// kra-mod-end
import registerServiceWorker from './registerServiceWorker';

import App from './Components/App';
import './index.css';

// kra-mod-start
if (KRA.REDUX && KRA.ROUTER) {
  const  { history, store } = configureStore(initStore());
} else if (KRA.REDUX) {
  const  store = configureStore(initStore());
} else if (KRA.ROUTER) {
  const history = createBrowserHistory();
}
// kra-mod-end

// kra-mod-start
if (KRA.SSR && KRA.REDUX && KRA.ROUTER) {
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
} else if (KRA.SSR && KRA.REDUX) {
  function render(Component, firstRender) {
    const rootNode = document.getElementById('root');
    const renderMethod =
      firstRender === true && rootNode.hasChildNodes()
        ? ReactDOM.hydrate
        : ReactDOM.render;

    renderMethod(
      <Provider store={store}>
        <Component />
      </Provider>,
      rootNode
    );
  }
} else if (KRA.SSR && KRA.ROUTER) {
  function render(Component, firstRender) {
    const rootNode = document.getElementById('root');
    const renderMethod =
      firstRender === true && rootNode.hasChildNodes()
        ? ReactDOM.hydrate
        : ReactDOM.render;

    renderMethod(
      <Router history={history}>
        <Component />
      </Router>,
      rootNode
    );
  }
} else if (KRA.SSR) {
  function render(Component, firstRender) {
    const rootNode = document.getElementById('root');
    const renderMethod =
      firstRender === true && rootNode.hasChildNodes()
        ? ReactDOM.hydrate
        : ReactDOM.render;

    renderMethod(<Component />, rootNode);
  }
} else if (KRA.REDUX && KRA.ROUTER) {
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
} else if (KRA.REDUX) {
  function render(Component) {
    ReactDOM.render(
      <Provider store={store}>
        <Component />
      </Provider>,
      document.getElementById('root')
    );
  }
} else if (KRA.ROUTER) {
  function render(Component) {
    ReactDOM.render(
      <Router history={history}>
        <Component />
      </Router>,
      document.getElementById('root')
    );
  }
} else {
  function render(Component) {
    ReactDOM.render(<Component />, document.getElementById('root'));
  }
}
// kra-mod-end

// kra-mod-start
if (KRA.SSR) {
  render(App, true);
} else {
  render(App);
}
// kra-mod-end

if(module.hot) {
  module.hot.accept('./Components/App', () => {
    const App = require('./Components/App').default;
    render(App);
  });
}

registerServiceWorker();
