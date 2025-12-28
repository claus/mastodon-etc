import { Bind, Listen } from '@/utils/decorators';
import styles from './Emoji.module.css';

export default class Emoji extends HTMLElement {
    @Bind
    @Listen('this', 'click')
    protected handleEvent(event: Event) {
        const target = event.target as HTMLElement;
        const button = target.closest<HTMLButtonElement>(`button:has(.${styles.caption})`);
        if (!button) return;

        const code = button.getAttribute('aria-label');
        const caption = button.querySelector<HTMLDivElement>(`:scope > .${styles.caption}`);
        if (code && caption) {
            navigator.clipboard
                .writeText(`:${code}:`)
                .then(() => {
                    const prevTimeoutId = caption.dataset.timeoutId;
                    if (prevTimeoutId) {
                        window.clearTimeout(Number(prevTimeoutId));
                    }
                    const timeoutId = window.setTimeout(() => {
                        caption.textContent = caption.dataset.captionText ?? '';
                        caption.classList.remove('copied');
                        delete caption.dataset.timeoutId;
                        delete caption.dataset.captionText;
                    }, 1000);
                    caption.dataset.timeoutId = timeoutId.toString();
                    caption.dataset.captionText ??= caption.textContent;
                    caption.classList.add('copied');
                    caption.textContent = 'copiado ✓';
                })
                .catch(err => {
                    console.error('Failed to copy emoji:', err);
                });
        }
    }
}
