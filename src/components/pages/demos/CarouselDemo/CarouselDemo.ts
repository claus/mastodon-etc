import { Bind, Listen, Ref } from '@/utils/decorators';
import { Carousel } from '@/components/ui/Carousel/Carousel';
import { CarouselSnapEvent } from '@/components/ui/Carousel/events/CarouselSnapEvent';

class CarouselDemo extends HTMLElement {
    @Ref('carousel') declare carousel: Carousel | null;
    @Ref('prev') declare prev: HTMLButtonElement | null;
    @Ref('next') declare next: HTMLButtonElement | null;
    @Ref('info') declare info: HTMLSpanElement | null;

    @Bind
    @Listen('prev', 'click')
    onPrevClick() {
        this.carousel?.prev();
    }

    @Bind
    @Listen('next', 'click')
    onNextClick() {
        this.carousel?.next();
    }

    @Bind
    @Listen('carousel', CarouselSnapEvent.TYPE)
    onCarouselSnap(event: CarouselSnapEvent) {
        if (this.info) this.info.textContent = `${event.index + 1}/137`;
    }
}

export default CarouselDemo;
