import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const getPost = slug => {
    const postPath = path.join(process.cwd(), 'pages', `${slug}.mdx`);
    const fileContents = fs.readFileSync(postPath, 'utf8');
    const { data, content } = matter(fileContents);
    return { data, content };
};

export const getPosts = () => {
    const dir = path.join(process.cwd(), 'pages');
    const dirFiles = fs.readdirSync(dir, { withFileTypes: true });
    return dirFiles
        .filter(dirEntry => dirEntry.name.endsWith('.mdx'))
        .map(dirEntry => {
            const slug = dirEntry.name.replace(/.mdx$/, '');
            return { ...getPost(slug), slug };
        });
};

export const getPostMeta = slug => ({
    meta: getPost(slug).data,
});

export const getPostStaticProps = slug => ctx => {
    return {
        revalidate: 60,
        props: {
            ...getPostMeta(slug),
            domain: ctx.params?.domain ?? 'mastodon.com.br',
        },
    };
};
