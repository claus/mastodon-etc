import { Carousel } from '@/components/ui/Carousel/Carousel';
import { CarouselSnapEvent } from '@/components/ui/Carousel/events/CarouselSnapEvent';

class CarouselDemoEww extends HTMLElement {
    carousel: Carousel | null = null;
    prev: HTMLButtonElement | null = null;
    next: HTMLButtonElement | null = null;
    info: HTMLSpanElement | null = null;

    onCarouselSnapBound: (event: Event) => void;
    onPrevClickBound: () => void;
    onNextClickBound: () => void;

    constructor() {
        super();
        this.onCarouselSnapBound = this.onCarouselSnap.bind(this);
        this.onPrevClickBound = this.onPrevClick.bind(this);
        this.onNextClickBound = this.onNextClick.bind(this);
    }

    connectedCallback() {
        this.carousel = this.querySelector('[data-ref="carousel"]');
        this.prev = this.querySelector('[data-ref="prev"]');
        this.next = this.querySelector('[data-ref="next"]');
        this.info = this.querySelector('[data-ref="info"]');
        this.carousel?.addEventListener(CarouselSnapEvent.TYPE, this.onCarouselSnapBound);
        this.prev?.addEventListener('click', this.onPrevClickBound);
        this.next?.addEventListener('click', this.onNextClickBound);
    }

    disconnectedCallback() {
        this.carousel?.removeEventListener(CarouselSnapEvent.TYPE, this.onCarouselSnapBound);
        this.prev?.removeEventListener('click', this.onPrevClickBound);
        this.next?.removeEventListener('click', this.onNextClickBound);
    }

    onNextClick() {
        this.carousel?.next();
    }

    onPrevClick() {
        this.carousel?.prev();
    }

    onCarouselSnap(event: Event) {
        if (this.info) this.info.textContent = `${(event as CarouselSnapEvent).index + 1}/137`;
    }
}

export default CarouselDemoEww;
