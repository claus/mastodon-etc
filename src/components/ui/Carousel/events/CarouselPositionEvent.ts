/**
 *  Payload of the CarouselPositionEvent
 */
type CarouselPositionEventData = {
    /* The size of the carousel container element */
    containerSize: number;
    /* Specifies where within the container items should snap into place */
    snapPosition: number;
    /* The gap between items */
    gap: number;
    /* All currently visible items */
    visibleItems: {
        /* The index of the item */
        index: number;
        /* A reference to the item element */
        element: HTMLElement;
        /* The position of the start (left or top) edge of the item relative to the container */
        startPos: number;
        /* The position of the end (right or bottom) edge of the item relative to the container */
        endPos: number;
    }[];
};

/**
 * Custom event dispatched when the carousel snaps to a new position
 */
export class CarouselPositionEvent extends CustomEvent<CarouselPositionEventData> {
    static TYPE = 'carousel-position';

    constructor(data: CarouselPositionEventData) {
        super(CarouselPositionEvent.TYPE, { detail: data });
    }

    get containerSize() {
        return this.detail.containerSize;
    }

    get snapPosition() {
        return this.detail.snapPosition;
    }

    get gap() {
        return this.detail.gap;
    }

    get visibleItems() {
        return this.detail.visibleItems;
    }

    toString(): string {
        return `CarouselPositionEvent, visible items: [${this.visibleItems.map(item => item.index).join(', ')}]`;
    }
}

/**
 * Type guard to check if an event is a CarouselPositionEvent
 */
export function isCarouselPositionEvent(event: Event): event is CarouselPositionEvent {
    return (
        event instanceof CarouselPositionEvent ||
        (event instanceof CustomEvent && event.type === CarouselPositionEvent.TYPE)
    );
}
