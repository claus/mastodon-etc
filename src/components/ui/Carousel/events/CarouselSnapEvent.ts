/**
 *  Payload of the CarouselSnapEvent
 */
type CarouselSnapEventData = {
    /* The index of the item */
    index: number;
    /* A reference to the item element */
    element: HTMLElement;
};

/**
 * Custom event dispatched when the carousel snaps to a new position
 */
export class CarouselSnapEvent extends CustomEvent<CarouselSnapEventData> {
    static TYPE = 'carousel-snap';

    constructor(data: CarouselSnapEventData) {
        super(CarouselSnapEvent.TYPE, { detail: data, bubbles: true });
    }

    get index(): number {
        return this.detail.index;
    }

    get element(): HTMLElement {
        return this.detail.element;
    }

    toString(): string {
        return `CarouselSnapEvent, index: ${this.index}`;
    }
}

/**
 * Type guard to check if an event is a CarouselSnapEvent
 */
export function isCarouselSnapEvent(event: Event): event is CarouselSnapEvent {
    return (
        event instanceof CarouselSnapEvent ||
        (event instanceof CustomEvent && event.type === CarouselSnapEvent.TYPE)
    );
}
