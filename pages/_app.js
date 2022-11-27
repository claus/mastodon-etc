// Resets, global styles
import 'styles/global/reset.scss';
import 'styles/global/theme.scss';

// Global CSS variable definitions
import 'styles/global/grid.scss';
import 'styles/global/colors.scss';
import 'styles/global/animations.scss';
import 'styles/global/misc.scss';

import { useRouter } from 'next/router';
import { removeHash } from 'utils';

import useNextCssRemovalPrevention from 'hooks/useNextCssRemovalPrevention';

import NextHead from 'next/head';

import { ThemeProvider } from 'components/misc/Theme';
import GridOverlay from 'components/ui/GridOverlay';
import MDX from 'components/misc/MDX';

// prettier-ignore
const Head = () => (
    <NextHead>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
        <link rel="preload" href="/fonts/FiraCode-VF.woff2" as="font" type="font/woff2" crossOrigin="true" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
    </NextHead>
);

function App({ Component, pageProps }) {
    const router = useRouter();

    useNextCssRemovalPrevention();

    return (
        <>
            <Head />
            <ThemeProvider>
                <MDX>
                    <Component {...pageProps} key={removeHash(router.asPath)} />
                </MDX>
                <GridOverlay />
            </ThemeProvider>
        </>
    );
}

export default App;
