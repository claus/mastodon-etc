import { createContext, useState, useEffect } from 'react';

const DARK = 'dark';
const LIGHT = 'light';
const LOCALSTORAGE_KEY = 'theme';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeInternal] = useState();

    const setTheme = value => {
        setThemeInternal(value);
        localStorage.setItem(LOCALSTORAGE_KEY, value);
        document.documentElement.dataset.theme = value;
    };

    useEffect(() => {
        if ('theme' in document.documentElement.dataset) {
            setThemeInternal(document.documentElement.dataset.theme);
        }
        const handleChange = event => {
            const theme = event.matches ? DARK : LIGHT;
            setThemeInternal(theme);
            document.documentElement.dataset.theme = theme;
        };
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// const themeScript = `(function() {
//     function getTheme() {
//         const saved = window.localStorage.getItem('${LOCALSTORAGE_KEY}');
//         if (typeof saved === 'string') return saved;
//         const mql = window.matchMedia('(prefers-color-scheme: dark)');
//         if (typeof mql.matches === 'boolean') return mql.matches ? '${DARK}' : '${LIGHT}';
//         return '${DARK}';
//     }
//     document.documentElement.dataset.theme = getTheme();
// })();`;

export const ThemeScript = () => {
    const themeScript = `function a(){let a=window.localStorage.getItem("${LOCALSTORAGE_KEY}");if("string"==typeof a)return a;let b=window.matchMedia("(prefers-color-scheme: dark)");return"boolean"==typeof b.matches?b.matches?"${DARK}":"${LIGHT}":"${DARK}"}document.documentElement.dataset.theme=a()`;
    return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};
