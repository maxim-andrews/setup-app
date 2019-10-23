import React from 'react';

import styles from './Blink.css';
import reactRouterLogo from '../../Shared/Assets/react_router_logo.svg';

const Blink = () => {
  return (
    <div className={styles.blinkLogo}>
      <img src={reactRouterLogo} alt="React Router Logo" />
    </div>
  );
};

export default Blink;
