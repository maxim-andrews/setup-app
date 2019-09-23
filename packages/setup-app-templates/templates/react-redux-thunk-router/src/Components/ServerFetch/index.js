import React from 'react';
// kra-mod-start
/* eslint-disable import/first */
if (KRA.REDUX) {
  import { connect } from 'react-redux';
  import PropTypes from 'prop-types';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.THUNK) {
  import { fetchServerData } from './actions.thunk'; // kra-mod-replace .thunk
} else {
  import { setFetching, setOsTime, setError } from './actions';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.SASS && KRA.LESS && KRA.POSTCSS) {
  import sass from './sass-less-post/ServerFetch.scss'; // kra-mod-replace /sass-less-post
  import less from './sass-less-post/ServerFetch.less'; // kra-mod-replace /sass-less-post
  import postcss from './sass-less-post/ServerFetch.css'; // kra-mod-replace /sass-less-post

  const styles = Object.assign(sass, less, postcss);
} else if (KRA.SASS && KRA.LESS) {
  import less from './sass-less/ServerFetch.less'; // kra-mod-replace /sass-less
  import sass from './sass-less/ServerFetch.scss'; // kra-mod-replace /sass-less

  const styles = Object.assign(less, sass);
} else if (KRA.LESS && KRA.POSTCSS) {
  import less from './less-post/ServerFetch.less'; // kra-mod-replace /less-post
  import postcss from './less-post/ServerFetch.css'; // kra-mod-replace /less-post

  const styles = Object.assign(less, postcss);
} else if (KRA.SASS && KRA.POSTCSS) {
  import sass from './sass-post/ServerFetch.scss'; // kra-mod-replace /sass-post
  import postcss from './sass-post/ServerFetch.css'; // kra-mod-replace /sass-post

  const styles = Object.assign(sass, postcss);
} else if (KRA.SASS) {
  import styles from './ServerFetch.scss';
} else if (KRA.LESS) {
  import styles from './ServerFetch.less';
} else if (KRA.POSTCSS) {
  import styles from './ServerFetch.post.css'; // kra-mod-replace .post
} else {
  import styles from './ServerFetch.css';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
if (KRA.REDUX && KRA.THUNK) {
  function ServerFetch ({ hostTime, hostOS, fetching, error, fetchServerData }) {
    render() {
      return (
        <div className={styles.serverDataHolder}>
          <div>
            <label htmlFor="host-time">Host Time</label>
            <span id="host-time">{hostTime}</span>
          </div>
          <div>
            <label htmlFor="host-os">Host OS</label>
            <span id="host-os">{hostOS}</span>
          </div>
          <div className={styles.errorMessage}>{error || ''}</div>
          <button
            onClick={fetchServerData}
            disabled={fetching}>{
              fetching
                ? '5 Secs Server Side Delayed Fetching...'
                : 'Fetch from Server'
            }</button>
        </div>
      );
    }
  }
} else if (KRA.REDUX) {
  function ServerFetch ({ hostTime, hostOS, error, fetching, setFetching, setOsTime, setError }) {
    function fetchServerData () {
      if (fetching) {
        return;
      }

      setFetching();

      fetch('/hostosandtime', {
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, same-origin, *omit
        headers: {
          'accept': 'application/json'
        },
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        redirect: 'follow' // manual, *follow, error
      })
        .then(response => {
          if (response.status >= 400) {
            setError(response.statusText);
            throw Error(response.statusText);
          }

          return response.json();
        })
        .then(json => {
          setOsTime({
            hostOS: json.hostOS,
            hostTime: json.time
          });
        })
        .catch(e => {
          setError(e.message);
        });
    }

    render() {
      return (
        <div className={styles.serverDataHolder}>
          <div>
            <label htmlFor="host-time">Host Time</label>
            <span id="host-time">{hostTime}</span>
          </div>
          <div>
            <label htmlFor="host-os">Host OS</label>
            <span id="host-os">{hostOS}</span>
          </div>
          <div className={styles.errorMessage}>{error || ''}</div>
          <button
            onClick={fetchServerData}
            disabled={fetching}>{
              fetching
                ? '5 Secs Server Side Delayed Fetching...'
                : 'Fetch from Server'
            }</button>
        </div>
      );
    }
  }
} else {
  class ServerFetch extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        hostOS: 'Fetch It',
        hostTime: 'Fetch It',
        fetching: false,
        error: false
      };

      this.fetchServerData = this.fetchServerData.bind(this);
    }

    fetchServerData () {
      if (this.state.fetching) {
        return;
      }

      this.setState({ fetching: true });

      fetch('/hostosandtime', {
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, same-origin, *omit
        headers: {
          'accept': 'application/json'
        },
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        redirect: 'follow' // manual, *follow, error
      })
        .then(response => {
          if (response.status >= 400) {
            this.setState({
              fetching: false,
              error: response.statusText
            });
            throw Error(response.statusText);
          }

          return response.json();
        })
        .then(json => {
          this.setState({
            fetching: false,
            error: false,
            hostOS: json.hostOS,
            hostTime: json.time
          });
        })
        .catch(e => {
          this.setState({
            fetching: false,
            error: e.message
          });
        });
    }

    render() {
      return (
        <div className={styles.serverDataHolder}>
          <div>
            <label htmlFor="host-time">Host Time</label>
            <span id="host-time">{this.state.hostTime}</span>
          </div>
          <div>
            <label htmlFor="host-os">Host OS</label>
            <span id="host-os">{this.state.hostOS}</span>
          </div>
          <div className={styles.errorMessage}>{this.state.error || ''}</div>
          <button
            onClick={this.fetchServerData}
            disabled={this.state.fetching}>{
              this.state.fetching
                ? '5 Secs Server Side Delayed Fetching...'
                : 'Fetch from Server'
            }</button>
        </div>
      );
    }
  }
}
// kra-mod-end

// kra-mod-start
if (KRA.REDUX && KRA.THUNK) {
  ServerFetch.propTypes = {
    hostOS: PropTypes.string.isRequired,
    hostTime: PropTypes.string.isRequired,
    fetching: PropTypes.bool.isRequired,
    error: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.bool
    ]).isRequired,
    fetchServerData: PropTypes.func.isRequired
  };

  export default connect(
    state => ({
      hostOS: state.server.hostOS,
      hostTime: state.server.hostTime,
      fetching: state.server.fetching,
      error: state.server.error
    }),
    {
      fetchServerData
    }
  )(ServerFetch);
} else if (KRA.REDUX) {
  ServerFetch.propTypes = {
    hostOS: PropTypes.string.isRequired,
    hostTime: PropTypes.string.isRequired,
    fetching: PropTypes.bool.isRequired,
    error: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.bool
    ]).isRequired,
    setFetching: PropTypes.func.isRequired,
    setOsTime: PropTypes.func.isRequired,
    setError: PropTypes.func.isRequired
  };

  export default connect(
    state => ({
      hostOS: state.server.hostOS,
      hostTime: state.server.hostTime,
      fetching: state.server.fetching,
      error: state.server.error
    }),
    {
      setFetching,
      setOsTime,
      setError
    }
  )(ServerFetch);
} else {
  export default ServerFetch;
}
// kra-mod-end
