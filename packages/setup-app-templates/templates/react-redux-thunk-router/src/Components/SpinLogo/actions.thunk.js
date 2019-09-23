// kra-mod-start
if (KRA.THUNK) {
  const {
    SET_REACT_SPIN,
    SET_REACT,
    SET_REDUX_SPIN,
    SET_REDUX
  } = require('./constants.thunk'); // kra-mod-replace .thunk
}
// kra-mod-end

function startCount (dispatch, getState, logoType, SET_LOGO, SET_LOGO_SPIN) {
  dispatch({ type: SET_LOGO, payload: 5 });

  const reactInterval = setInterval(() => {
    const logoObj = getState().spin[logoType];

    if (logoObj.start > 1) {
      dispatch({ type: SET_LOGO, payload: logoObj.start - 1 });
    } else {
      clearInterval(reactInterval);
      dispatch({ type: SET_LOGO_SPIN });
    }
  }, 1000);
}

exports = module.exports = {
  spinReact () {
    return (dispatch, getState) => startCount(
      dispatch,
      getState,
      'React',
      SET_REACT,
      SET_REACT_SPIN
    );
  },

  spinRedux () {
    return (dispatch, getState) => startCount(
      dispatch,
      getState,
      'Redux',
      SET_REDUX,
      SET_REDUX_SPIN
    );
  }
};
