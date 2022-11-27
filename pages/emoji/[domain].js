import { getStaticProps as getEmojiStaticProps } from '../emoji.mdx';

export async function getStaticPaths() {
    return { paths: [], fallback: 'blocking' };
}

export const getStaticProps = getEmojiStaticProps;

export { default } from 'pages/emoji.mdx';
