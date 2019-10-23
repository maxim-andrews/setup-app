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
if (KRA.REDUX && KRA.THUNK) {
  import { spinReact, spinRedux } from './actions.thunk'; // kra-mod-replace .thunk
} else if (KRA.CSR && KRA.REDUX) {
  import { spinReact, spinRedux } from './actions';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.REDUX) {
  import reactLogo from '../../Shared/Assets/react_logo.svg';
  import reduxLogo from '../../Shared/Assets/redux_logo.svg';
} else {
  import logo from '../../Shared/Assets/react_logo.svg'; // kra-mod-replace ./../Shared/Assets/react_ /
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
/* eslint-disable import/first */
if (KRA.SASS && KRA.LESS && KRA.POSTCSS) {
  import sass from './sass-less-post/SpinLogo.scss'; // kra-mod-replace /sass-less-post
  import less from './sass-less-post/SpinLogo.less'; // kra-mod-replace /sass-less-post
  import postcss from './sass-less-post/SpinLogo.css'; // kra-mod-replace /sass-less-post

  const styles = Object.assign(sass, less, postcss);
} else if (KRA.SASS && KRA.LESS) {
  import less from './sass-less/SpinLogo.less'; // kra-mod-replace /sass-less
  import sass from './sass-less/SpinLogo.scss'; // kra-mod-replace /sass-less

  const styles = Object.assign(less, sass);
} else if (KRA.LESS && KRA.POSTCSS) {
  import less from './less-post/SpinLogo.less'; // kra-mod-replace /less-post
  import postcss from './less-post/SpinLogo.css'; // kra-mod-replace /less-post

  const styles = Object.assign(less, postcss);
} else if (KRA.SASS && KRA.POSTCSS) {
  import sass from './sass-post/SpinLogo.scss'; // kra-mod-replace /sass-post
  import postcss from './sass-post/SpinLogo.css'; // kra-mod-replace /sass-post

  const styles = Object.assign(sass, postcss);
} else if (KRA.SASS) {
  import styles from './SpinLogo.scss';
} else if (KRA.LESS) {
  import styles from './SpinLogo.less';
} else if (KRA.POSTCSS) {
  import styles from './SpinLogo.post.css'; // kra-mod-replace .post
} else {
  import styles from './SpinLogo.css';
}
/* eslint-enable import/first */
// kra-mod-end

// kra-mod-start
if (KRA.CSR && KRA.REDUX) {
  const spintIt = {
    React: spinReact,
    Redux: spinRedux
  };
}
// kra-mod-end

// kra-mod-start
if (KRA.REDUX) {
  const logo = {
    React: reactLogo,
    Redux: reduxLogo
  };
}
// kra-mod-end

// kra-mod-start
if (KRA.REDUX && KRA.THUNK) {
  const SpinLogo = ({ type, start, spin, spinIt, logo }) => {
    return (
      <div className={styles.logoHolder + (spin ? ` ${styles.spinLogo}` : '')}>
        <img src={logo} className={styles.logo} alt={`${type} Logo`} />
        <button className={styles.btn} onClick={spinIt} disabled={start > 0}>{start > 0 ? `Starts in ${start}` : `Spin ${type}`}</button>
      </div>
    );
  };
} else if (KRA.CSR && KRA.REDUX) {
  const SpinLogo = ({ type, spin, spinIt, logo }) => {
    return (
      <div className={styles.logoHolder + (spin ? ` ${styles.spinLogo}` : '')}>
        <img src={logo} className={styles.logo} alt={`${type} Logo`} />
        <button className={styles.btn} onClick={spinIt}>{`Spin ${type}`}</button>
      </div>
    );
  };
} else if (KRA.REDUX) {
  const SpinLogo = ({ type, spin, path, logo }) => {
    return (
      <div className={styles.logoHolder + (spin ? ` ${styles.spinLogo}` : '')}>
        <img src={logo} className={styles.logo} alt={`${type} Logo`} />
        <a className={styles.btn} href={path + '?type=' + type}>{`Spin ${type}`}</a>
      </div>
    );
  };
} else {
  const SpinLogo = () => {
    return (
      <div className={`${styles.logoHolder} ${styles.spinLogo}`}>
        <img src={logo} className={styles.logo} alt="React Logo" />
      </div>
    );
  };
}
// kra-mod-end

// kra-mod-start
if (KRA.REDUX && KRA.THUNK) {
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
} else if (KRA.CSR && KRA.REDUX) {
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
} else if (KRA.REDUX) {
  SpinLogo.propTypes = {
    type: PropTypes.string.isRequired,
    spin: PropTypes.bool.isRequired,
    logo: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired
  };

  export default connect(
    (state, ownProps) => ({
      spin: state.spin[ownProps.type],
      logo: logo[ownProps.type],
      path: state.spin.path
    })
  )(SpinLogo);
} else {
  export default SpinLogo;
}
// kra-mod-end
