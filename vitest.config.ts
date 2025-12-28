/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
    ssr: {
        // Fix for Vitest 4 + Astro: prevents "filename.replace is not a function" error
        // We might be able to remove this once Astro 6 is released with Vite 7 support
        noExternal: true,
    },
    test: {
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', 'public', '.git', '.astro', '.vscode'],
    },
});
