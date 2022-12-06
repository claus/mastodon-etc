export function resolveError(error, domain, fetchTimeout) {
    let status = 500;
    let statusText = `A ${domain} respondeu com erro desconhecido`;
    if (error.name === 'FetchError') {
        if (error.type === 'invalid-json') {
            status = 422;
            statusText = `The Emoji API on ${domain} returned data that we don't understand`;
        } else if (error.type === 'system') {
            status = 503;
            statusText = `A instância ${domain} é indisponível`;
        }
    }
    if (error.name === 'AbortError') {
        status = 408;
        statusText = `A instância ${domain} levou mais de ${fetchTimeout} segundos para responder`;
    }
    statusText += ` ("${error.message.replace(/\.$/, '')}")`;
    return { status, statusText };
}
