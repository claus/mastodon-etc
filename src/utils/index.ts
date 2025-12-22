export function modulo(a: number, b: number): number {
    return ((a % b) + b) % b;
}

export function last<T>(array: T[]): T | undefined {
    return typeof array !== 'undefined' && Array.isArray(array)
        ? array[array.length - 1]
        : undefined;
}

export function mappable(size: number): number[] {
    return new Array(size).fill(0).map((_, i) => i);
}

export function wait(delay: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

export function removeHash(url: string): string {
    const urlBase = 'http://a';
    const urlObj = new URL(url, urlBase);
    if (urlObj.origin !== urlBase) {
        urlObj.hash = '';
        return urlObj.toString();
    }
    return `${urlObj.pathname}${urlObj.search}`;
}

export function getHash(url: string): string {
    return new URL(url, 'http://a').hash;
}

const R_INTERNAL = /^\/.?/;
const R_EXTERNAL = /^((https?:)?\/\/|mailto:)/;

export type UrlType = 'external' | 'internal' | 'error';

export function fixUrl(url: string): { type: UrlType; url: string } {
    if (url.match(R_EXTERNAL)) {
        return {
            type: 'external',
            url,
        };
    } else if (url.match(R_INTERNAL)) {
        return {
            type: 'internal',
            url,
        };
    } else {
        return {
            type: 'error',
            url,
        };
    }
}

export interface Emoji {
    shortcode: string;
    url: string;
    static_url: string;
    visible_in_picker: boolean;
    category?: string;
}

export interface CompressedEmoji {
    code: string;
    url: string;
    static_url: string;
    visible: boolean;
    category?: string;
}

export const compressEmojiJSON = (emojis: any[]): { baseUrl: string; emojis: CompressedEmoji[] } => {
    if (!Array.isArray(emojis) || emojis.length === 0) {
        return { baseUrl: '', emojis: [] };
    }
    const getMaxBase = (url: string, maxBaseCurrent: string): string => {
        if (url.startsWith(maxBaseCurrent)) return maxBaseCurrent;
        let i = 0;
        const len = Math.min(url.length, maxBaseCurrent.length);
        while (i < len && url[i] === maxBaseCurrent[i]) i++;
        return maxBaseCurrent.slice(0, i);
    };
    let maxBase = emojis[0].url;
    emojis.forEach(emoji => {
        maxBase = getMaxBase(emoji.url, maxBase);
        maxBase = getMaxBase(emoji.static_url, maxBase);
    });
    const maxBaseLength = maxBase.length;
    const compressedEmojis = emojis.map(({ category, ...emoji }) => {
        const result = {
            code: emoji.shortcode,
            url: emoji.url.slice(maxBaseLength),
            static_url: emoji.static_url.slice(maxBaseLength),
            visible: emoji.visible_in_picker,
        };
        return category ? { category, ...result } : result;
    });
    return {
        baseUrl: maxBase,
        emojis: compressedEmojis,
    };
};
