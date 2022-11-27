import cx from 'classnames';

import Head from 'components/misc/Head';

import styles from './MDXPostLayout.module.scss';
import grid from 'styles/modules/grid.module.scss';

const MDXPostLayout = ({ children, meta = {} }) => {
    const { title, description } = meta;
    return (
        <div className={cx(grid.container, styles.root)}>
            <Head title={title} description={description} />
            <h1>{title}</h1>
            {children}
        </div>
    );
};

export default MDXPostLayout;
