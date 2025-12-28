import { defineConfig } from 'astro/config';
import * as dotenv from 'dotenv';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

dotenv.config({ quiet: true });

export default defineConfig({
    site: `https://${process.env.SITE_DOMAIN}`,
    output: 'server',
    build: { assets: '_static' },
    adapter: vercel({ isr: { expiration: 600 } }),
    integrations: [sitemap(), mdx()],
    devToolbar: { enabled: false },
    experimental: {
        fonts: [
            {
                provider: 'local',
                name: 'Atkinson Hyperlegible',
                cssVariable: '--font-atkinson',
                fallbacks: ['Arial', 'sans-serif'],
                variants: [
                    {
                        weight: '400',
                        style: 'normal',
                        src: ['./src/assets/fonts/Atkinson-Hyperlegible-Regular-102a.fixed.woff2'],
                    },
                    {
                        weight: '700',
                        style: 'normal',
                        src: ['./src/assets/fonts/Atkinson-Hyperlegible-Bold-102a.fixed.woff2'],
                    },
                    {
                        weight: '400',
                        style: 'italic',
                        src: ['./src/assets/fonts/Atkinson-Hyperlegible-Italic-102a.fixed.woff2'],
                    },
                    {
                        weight: '700',
                        style: 'italic',
                        src: [
                            `./src/assets/fonts/Atkinson-Hyperlegible-BoldItalic-102a.fixed.woff2`,
                        ],
                    },
                ],
            },
            {
                provider: 'local',
                name: 'Fira Code',
                cssVariable: '--font-fira',
                fallbacks: ['Consolas', 'monospace'],
                variants: [
                    {
                        weight: '400 700',
                        style: 'normal',
                        src: ['./src/assets/fonts/FiraCode-VF.woff2'],
                    },
                ],
            },
        ],
    },
});
