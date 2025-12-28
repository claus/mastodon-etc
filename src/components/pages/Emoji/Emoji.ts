import { Bind, Listen } from '@/utils/decorators';

export default class Emoji extends HTMLElement {
    @Bind
    @Listen('this', 'click')
    private handleEvent(event: Event) {
        const target = event.target as HTMLElement;
        const button = target.closest<HTMLButtonElement>('button:has(.caption)');
        if (!button) return;

        const code = button.getAttribute('aria-label');
        const caption = button.querySelector<HTMLDivElement>(':scope > .caption');
        if (code && caption) {
            navigator.clipboard
                .writeText(`:${code}:`)
                .then(() => {
                    caption.textContent = 'copiado ✓';
                    caption.classList.add('copied');
                    const prevTimeoutId = caption.dataset.timeoutId;
                    if (prevTimeoutId) {
                        window.clearTimeout(Number(prevTimeoutId));
                    }
                    const timeoutId = window.setTimeout(() => {
                        caption.textContent = `:${code}:`;
                        caption.classList.remove('copied');
                        delete caption.dataset.timeoutId;
                    }, 1000);
                    caption.dataset.timeoutId = timeoutId.toString();
                })
                .catch(err => {
                    console.error('Failed to copy emoji:', err);
                });
        }
    }
}
