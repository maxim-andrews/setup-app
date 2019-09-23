import React from 'react';

import SpinLogo from '../SpinLogo';

function Spin () {
  return (
    <React.Fragment>
      <SpinLogo type="React" />
      <SpinLogo type="Redux" />
    </React.Fragment>
  );
}

export default Spin;
