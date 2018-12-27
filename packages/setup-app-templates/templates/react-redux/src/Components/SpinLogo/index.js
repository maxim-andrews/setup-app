import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import styles from './SpinLogo.css';
import reactLogo from './react_logo.svg';
import reduxLogo from './redux_logo.svg';

import { spinReact, spinRedux } from './actions';

const spintIt = {
  React: spinReact,
  Redux: spinRedux
};

const logo = {
  React: reactLogo,
  Redux: reduxLogo
};

const SpinLogo = ({ type, spin, spinIt, logo  }) => {
  return (
    <div className={styles.logoHolder + (spin ? ` ${styles.spinLogo}` : '')}>
      <img src={logo} className={styles.logo} alt="{type} Logo" />
      <button onClick={spinIt}>Spin {type}</button>
    </div>
  );
};

SpinLogo.propTypes = {
  type: PropTypes.string.isRequired,
  spin: PropTypes.bool.isRequired,
  spinIt: PropTypes.func.isRequired,
  logo: PropTypes.string.isRequired
};

export default connect(
  (state, ownProps) => ({
    spin: state.spin[ownProps.type],
    logo: logo[ownProps.type]
  }),
  (dispatch, ownProps) => ({
    spinIt: () => dispatch(spintIt[ownProps.type]())
  })
)(SpinLogo);
