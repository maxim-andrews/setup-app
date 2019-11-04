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
  function ServerSide ({ url, store, context }) {
    return (
      <Provider store={store}>
        <StaticRouter location={url} context={context}>
          <App />
        </StaticRouter>
      </Provider>
    );
  }

  ServerSide.propTypes = {
    url: PropTypes.string.isRequired,
    store: PropTypes.object.isRequired,
    context: PropTypes.object.isRequired
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
  function ServerSide ({ url, context }) {
    return (
      <StaticRouter location={url} context={context}>
        <App />
      </StaticRouter>
    );
  }

  ServerSide.propTypes = {
    url: PropTypes.string.isRequired,
    context: PropTypes.object.isRequired
  };
} else {
  // eslint-disable-next-line react/display-name
  function ServerSide () {
    return <App />;
  }
}
// kra-mod-end

export default ServerSide;
