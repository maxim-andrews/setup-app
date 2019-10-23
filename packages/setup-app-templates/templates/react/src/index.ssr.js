import React from 'react';
// kra-mod-start
/* eslint-disable import/first */
if (KRA.REDUX && KRA.ROUTER) {
  import PropTypes from 'prop-types';
  import { Provider } from 'react-redux';
  import { StaticRouter } from 'react-router';
} else if (KRA.REDUX) {
  import PropTypes from 'prop-types';
  import { Provider } from 'react-redux';
} else if (KRA.ROUTER) {
  import PropTypes from 'prop-types';
  import { StaticRouter } from 'react-router';
}
/* eslint-enable import/first */
// kra-mod-end

import App from './Components/App';
import './index.css';

// kra-mod-start
if (KRA.REDUX && KRA.ROUTER) {
  // eslint-disable-next-line react/display-name
  function ServerSide ({ path, store, routerCtx }) {
    return (
      <Provider store={store}>
        <StaticRouter location={path} context={routerCtx}>
          <App />
        </StaticRouter>
      </Provider>
    );
  }

  ServerSide.propTypes = {
    path: PropTypes.string.isRequired,
    store: PropTypes.object.isRequired,
    routerCtx: PropTypes.object.isRequired
  };
} else if (KRA.REDUX) {
  // eslint-disable-next-line react/display-name
  function ServerSide ({ store }) {
    return (
      <Provider store={store}>
        <App />
      </Provider>
    );
  }

  ServerSide.propTypes = {
    store: PropTypes.object.isRequired
  };
} else if (KRA.ROUTER) {
  // eslint-disable-next-line react/display-name
  function ServerSide ({ path, routerCtx }) {
    return (
      <StaticRouter location={path} context={routerCtx}>
        <App />
      </StaticRouter>
    );
  }

  ServerSide.propTypes = {
    path: PropTypes.string.isRequired,
    routerCtx: PropTypes.object.isRequired
  };
} else {
  // eslint-disable-next-line react/display-name
  function ServerSide () {
    return <App />;
  }
}
// kra-mod-end

export default ServerSide;
