export default class GridOverlay extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        document.addEventListener('keypress', this.handleKey);
    }

    disconnectedCallback() {
        document.removeEventListener('keypress', this.handleKey);
    }

    private handleKey = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (event.key === 'g' && target.nodeName !== 'INPUT') {
            const el = this.querySelector(':scope > div');
            el?.classList.toggle('visible');
        }
    };
}
