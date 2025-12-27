export const fetchEmojis = async (domain = 'mastodon.com.br') => {
    const fetchTimeout = 5;
    const api = `https://${domain}/api/v1/custom_emojis`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout * 1000);

    try {
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

        const allEmojis = json.map((emoji: any) => ({
            code: emoji.shortcode,
            url: emoji.url,
            static_url: emoji.static_url,
            visible: emoji.visible_in_picker,
            category: emoji.category,
        }));

        const categories = allEmojis.reduce((acc: any, emoji: any) => {
            const { category = '' } = emoji;
            if (!acc[category]) acc[category] = [];
            acc[category].push(emoji);
            return acc;
        }, {});

        return {
            baseUrl: '',
            categories,
            status: response.status,
            domain,
        };
    } catch (error) {
        return {
            ...resolveError(error, domain, fetchTimeout),
            categories: {},
            baseUrl: '',
            domain,
        };
    } finally {
        clearTimeout(timeoutId);
    }
};

function resolveError(error: any, domain: string, fetchTimeout: number) {
    let status = 500;
    let statusText = `${domain} respondeu com erro desconhecido`;
    if (error.name === 'FetchError') {
        if (error.type === 'invalid-json') {
            status = 422;
            statusText = `A API de emojis em ${domain} retornou dados que não compreendemos`;
        } else if (error.type === 'system') {
            status = 503;
            statusText = `${domain} é indisponível`;
        }
    }
    if (error.name === 'AbortError') {
        status = 408;
        statusText = `${domain} levou mais de ${fetchTimeout} segundos para responder`;
    }
    statusText += ` ("${error.message.replace(/\.$/, '')}")`;
    return { status, statusText };
}
