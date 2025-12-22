export default class LazyImage extends HTMLElement {
    private img: HTMLImageElement;
    private observer: IntersectionObserver;

    constructor() {
        super();
        this.img = this.querySelector('img')!;
        this.observer = new IntersectionObserver(this.handleIntersection);
    }

    connectedCallback() {
        this.observer.observe(this.img);
    }

    disconnectedCallback() {
        this.observer.disconnect();
        this.img.removeEventListener('load', this.handleLoad);
    }

    handleIntersection: IntersectionObserverCallback = ([entry]) => {
        if (entry.isIntersecting) {
            this.observer.disconnect();
            this.img.src = this.img.dataset.src!;
            if (this.img.complete) {
                this.img.classList.add('loaded');
            } else {
                this.img.addEventListener('load', this.handleLoad);
            }
            delete this.img.dataset.src;
        }
    };

    handleLoad = () => {
        this.img.classList.add('loaded');
        this.img.removeEventListener('load', this.handleLoad);
    };
}
