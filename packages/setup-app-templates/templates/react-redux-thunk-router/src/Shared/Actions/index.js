const {
  SET_SERVER_ONLY
} = require('../Constants');

exports = module.exports = {
  setServerOnly () {
    return {
      type: SET_SERVER_ONLY
    };
  }
};
