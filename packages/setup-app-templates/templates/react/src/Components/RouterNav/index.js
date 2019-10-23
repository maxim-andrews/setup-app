import React from 'react';
import { NavLink } from 'react-router-dom';

// kra-mod-start
/* eslint-disable import/first */
if (KRA.SASS && KRA.LESS && KRA.POSTCSS) {
  import sass from './sass-less-post/RouterNav.scss'; // kra-mod-replace /sass-less-post
  import less from './sass-less-post/RouterNav.less'; // kra-mod-replace /sass-less-post
  import postcss from './sass-less-post/RouterNav.css'; // kra-mod-replace /sass-less-post

  const styles = Object.assign(sass, less, postcss);
} else if (KRA.SASS && KRA.LESS) {
  import less from './sass-less/RouterNav.less'; // kra-mod-replace /sass-less
  import sass from './sass-less/RouterNav.scss'; // kra-mod-replace /sass-less

  const styles = Object.assign(less, sass);
} else if (KRA.LESS && KRA.POSTCSS) {
  import less from './less-post/RouterNav.less'; // kra-mod-replace /less-post
  import postcss from './less-post/RouterNav.css'; // kra-mod-replace /less-post

  const styles = Object.assign(less, postcss);
} else if (KRA.SASS && KRA.POSTCSS) {
  import sass from './sass-post/RouterNav.scss'; // kra-mod-replace /sass-post
  import postcss from './sass-post/RouterNav.css'; // kra-mod-replace /sass-post

  const styles = Object.assign(sass, postcss);
} else if (KRA.SASS) {
  import styles from './RouterNav.scss';
} else if (KRA.LESS) {
  import styles from './RouterNav.less';
} else if (KRA.POSTCSS) {
  import styles from './RouterNav.post.css'; // kra-mod-replace .post
} else {
  import styles from './RouterNav.css';
}
/* eslint-enable import/first */
// kra-mod-end

function RouterNav () {
  return (
    <nav>
      <ul>
        <li><NavLink to="/spin" activeClassName={styles.active}>Spin</NavLink></li>
        <li><NavLink to="/blink" activeClassName={styles.active}>Blink</NavLink></li>
      </ul>
    </nav>
  );
}

export default RouterNav;
