import { compressEmojiJSON } from './index';
import { resolveError } from './emoji';

export const fetchEmojis = async () => {
    const fetchTimeout = 5;
    const domain = 'mastodon.com.br';
    const api = `https://${domain}/api/v1/custom_emojis`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), fetchTimeout * 1000);
        const response = await fetch(api, { signal: controller.signal });
        if (response.status >= 400) {
            return {
                status: response.status,
                statusText: `Error accessing Emoji API on ${domain} ("${response.statusText}")`,
                categories: {},
                baseUrl: '',
                domain,
            };
        }
        const json = await response.json();
        const { baseUrl, emojis: allEmojis } = compressEmojiJSON(json);
        const categories = allEmojis.reduce((acc: any, emoji: any) => {
            const { category = '' } = emoji;
            if (!acc[category]) acc[category] = [];
            acc[category].push(emoji);
            return acc;
        }, {});

        return {
            baseUrl,
            categories,
            status: response.status,
            domain,
        };
    } catch (e) {
        return { ...resolveError(e, domain, fetchTimeout), categories: {}, baseUrl: '', domain };
    }
};
