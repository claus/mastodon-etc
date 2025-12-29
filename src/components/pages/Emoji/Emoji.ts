import { Bind, Listen } from '@/utils/decorators';

export default class Emoji extends HTMLElement {
    @Bind
    @Listen('this', 'click')
    protected handleEvent(event: Event) {
        const target = event.target as Element;

        const button = target.closest<HTMLButtonElement>('button:has(img, span)');
        if (!button) return;

        const code = button.getAttribute('aria-label');
        if (!code) return;

        navigator.clipboard
            .writeText(`:${code}:`)
            .then(() => {
                const label = button.querySelector<HTMLSpanElement>(':scope > span');
                if (!label) return;

                const prevTimeoutId = label.dataset.timeoutId;
                if (prevTimeoutId) {
                    window.clearTimeout(Number(prevTimeoutId));
                }

                const timeoutId = window.setTimeout(() => {
                    label.textContent = label.dataset.captionText ?? '';
                    label.classList.remove('copied');
                    delete label.dataset.timeoutId;
                    delete label.dataset.captionText;
                }, 1000);

                label.dataset.timeoutId = timeoutId.toString();
                label.dataset.captionText ??= label.textContent;
                label.classList.add('copied');
                label.textContent = 'copiado ✓';
            })
            .catch(err => {
                console.error('Failed to copy emoji:', err);
            });
    }
}
