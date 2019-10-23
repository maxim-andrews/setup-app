const {
  SET_OS_TIME_FETCHING,
  SET_OS_TIME,
  SET_ERROR
} = require('./constants');

exports = module.exports = {
  setFetching: () => ({
    type: SET_OS_TIME_FETCHING
  }),
  setOsTime: ({ hostOS, hostTime }) => ({
    type: SET_OS_TIME,
    payload: {
      hostOS,
      hostTime
    }
  }),
  setError: (msg) => ({
    type: SET_ERROR,
    payload: msg
  })
};
