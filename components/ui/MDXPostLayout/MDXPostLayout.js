import cx from 'classnames';

import Head from 'components/misc/Head';

import styles from './MDXPostLayout.module.scss';
import grid from 'styles/modules/grid.module.scss';

const MDXPostLayout = ({ children, meta = {} }) => {
    const { title, description, type = 'post' } = meta;
    const isPost = type === 'post';
    const rootClass = cx(grid.container, styles.root, {
        [styles.post]: isPost,
    });
    return (
        <main className={rootClass}>
            <Head title={title} description={description} />
            {isPost && <h1>{title}</h1>}
            {children}
        </main>
    );
};

export default MDXPostLayout;
