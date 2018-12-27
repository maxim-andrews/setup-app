import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import styles from './SpinLogo.css';
import reactLogo from '../../Shared/Assets/react_logo.svg';
import reduxLogo from '../../Shared/Assets/redux_logo.svg';

import { spinReact, spinRedux } from './actions';

const spintIt = {
  React: spinReact,
  Redux: spinRedux
};

const logo = {
  React: reactLogo,
  Redux: reduxLogo
};

const SpinLogo = ({ type, start, spin, spinIt, logo  }) => {
  return (
    <div className={styles.logoHolder + (spin ? ` ${styles.spinLogo}` : '')}>
      <img src={logo} className={styles.logo} alt="{type} Logo" />
      <button onClick={spinIt} disabled={start > 0}>{start > 0 ? `Starts in ${start}` : `Spin ${type}`}</button>
    </div>
  );
};

SpinLogo.propTypes = {
  type: PropTypes.string.isRequired,
  start: PropTypes.number.isRequired,
  spin: PropTypes.bool.isRequired,
  spinIt: PropTypes.func.isRequired,
  logo: PropTypes.string.isRequired
};

export default connect(
  (state, ownProps) => ({
    start: state.spin[ownProps.type].start,
    spin: state.spin[ownProps.type].spin,
    logo: logo[ownProps.type]
  }),
  (dispatch, ownProps) => ({
    spinIt: () => dispatch(spintIt[ownProps.type]())
  })
)(SpinLogo);
