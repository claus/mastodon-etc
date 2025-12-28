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
