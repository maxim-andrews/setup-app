import React from 'react';

import styles from './Spin.css';
import reactLogo from '../../Shared/Assets/react_logo.svg';

const Spin = () => {
  return (
    <div className={styles.spinLogo}>
      <img src={reactLogo} alt="React Logo" />
    </div>
  );
};

export default Spin;
