import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const getPosts = () => {
    const cwd = process.cwd();
    const dir = path.join(cwd, 'pages');
    const dirFiles = fs.readdirSync(dir, { withFileTypes: true });
    return dirFiles
        .map(dirEntry => {
            if (dirEntry.name.endsWith('.mdx')) {
                const file = path.join(cwd, 'pages', dirEntry.name);
                const fileContent = fs.readFileSync(file, 'utf-8');
                const { data, content } = matter(fileContent);
                const slug = dirEntry.name.replace(/.mdx$/, '');
                return { data, content, slug };
            }
        })
        .filter(post => !!post);
};
