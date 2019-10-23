const {
  SET_OS_TIME_FETCHING,
  SET_OS_TIME,
  SET_ERROR
} = require('./constants');

exports = module.exports = {
  fetchServerData () {
    return (dispatch, getState) => {
      const fetching = getState().server.fetching;

      if (fetching) {
        return false;
      }

      dispatch({ type: SET_OS_TIME_FETCHING });

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
            this.button.current.disabled = false;
            throw Error(response.statusText);
          }

          return response.json();
        })
        .then(json => {
          dispatch({
            type: SET_OS_TIME,
            payload: {
              hostOS: json.hostOS,
              hostTime: json.time
            }
          });
        })
        .catch(e => {
          dispatch({
            type: SET_ERROR,
            payload: e.message
          });
        });
    };
  }
};
