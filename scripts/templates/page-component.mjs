export const pageComponentRoute = name => {
    return `---
import Layout from '@/layouts/Layout.astro';
import ${name} from '@/components/pages/${name}/${name}.astro';
---

<Layout>
    <${name} />
</Layout>
`;
};

export const pageComponentAstro = name => {
    return `---
import styles from './${name}.module.css';
---

<div class={styles.root}>
    <hgroup>
        <h1>${name}</h1>
        <p>This is the ${name} page.</p>
    </hgroup>
</div>
`;
};

export const pageComponentCSS = () => {
    return `.root {
}

@media (width >= 768px) {
}

@media (width >= 1280px) {
}

@media (width >= 1920px) {
}
`;
};
