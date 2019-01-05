import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { fetchServerData } from './actions';
import styles from './ServerFetch.css';

class ServerFetch extends Component {
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
          <span id="host-time">{this.props.hostTime}</span>
        </div>
        <div>
          <label htmlFor="host-os">Host OS</label>
          <span id="host-os">{this.props.hostOS}</span>
        </div>
        <div className={styles.errorMessage}>{this.props.error || ''}</div>
        <button
          onClick={this.props.fetchServerData}
          disabled={this.props.fetching}>{
            this.props.fetching
              ? 'Fetching ...'
              : 'Fetch from Server'
          }</button>
      </div>
    );
  }
}

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
