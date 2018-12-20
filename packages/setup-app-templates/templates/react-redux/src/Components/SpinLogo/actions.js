const {
  SET_REACT_SPIN,
  SET_REDUX_SPIN
} = require('./constants');

exports = module.exports = {
  spinReact () {
    return {
      type: SET_REACT_SPIN
    };
  },

  spinRedux () {
    return {
      type: SET_REDUX_SPIN
    };
  }
};
