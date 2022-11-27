import cx from 'classnames';

// import Head from 'components/misc/Head';

import styles from './MDXPostLayout.module.scss';
import grid from 'styles/modules/grid.module.scss';

const MDXPostLayout = ({ children }) => {
    return (
        <div className={cx(grid.container, styles.root)}>
            {children}
        </div>
    );
};

export default MDXPostLayout;
