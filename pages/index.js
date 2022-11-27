import { getPosts } from 'utils/posts';

export const getStaticProps = () => {
    const posts = getPosts();

    return {
        props: {
            posts,
        },
    };
};

export { default } from 'components/pages/Landing';
