import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import App from './Components/App';
import './index.css';

const context = {};

// eslint-disable-next-line react/display-name
function ServerSide({ path, store }) {
  return (
    <Provider store={store}>
      <StaticRouter location={path} context={context}>
        <App />
      </StaticRouter>
    </Provider>
  );
}

ServerSide.propTypes = {
  path: PropTypes.string.isRequired,
  store: PropTypes.object.isRequired
};

export default ServerSide;
