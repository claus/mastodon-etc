import cx from 'classnames';

import Head from 'components/misc/Head';
import Link from 'components/ui/Link';
import Text from 'components/ui/Text';

import grid from 'styles/modules/grid.module.scss';
import styles from './Landing.module.scss';

const Landing = ({ posts }) => {
    return (
        <div className={cx(grid.container, styles.root)}>
            <Head title="etc.mastodon.com.br" description="....." />
            <h1>Et Cetera</h1>
            <ul>
                {posts.map(post => (
                    <li key={post.slug}>
                        <Link href={`/${post.slug}`}>
                            <Text as="span">{post.data.title}</Text>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Landing;
