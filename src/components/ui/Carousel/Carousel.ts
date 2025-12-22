import type { CarouselOptions } from './types';
import { modulo, last, sign } from '@madeinhaus/utils'; // TODO: Replace last with at(-1)
import { getCSSValues, hermite } from './utils';
import { CarouselSnapEvent, isCarouselSnapEvent } from './events/CarouselSnapEvent';
import { CarouselPositionEvent, isCarouselPositionEvent } from './events/CarouselPositionEvent';

export { CarouselSnapEvent, isCarouselSnapEvent };
export { CarouselPositionEvent, isCarouselPositionEvent };

type SnapDistanceResult = { index: number; distance: number };
type ItemPositionResult = { startEdgePos: number; endEdgePos: number };
type DragStartValue = { t: number; pos: number };
type DragRegisterValue = { t: number; pos: number; dt: number; dpos: number };
type WheelDataValue = { t: number; d: number; dt?: number };
type AnimationState = { targetIndex: number; targetOffset: number; trigger?: string };
type QuinticState = { x: number; v: number; a: number };
type QuinticPlan = {
    durationMs: number;
    coeffs: [number, number, number, number, number, number];
    sample: (elapsedMs: number) => QuinticState & { done: boolean };
};

export class Carousel extends HTMLElement {
    private direction: NonNullable<CarouselOptions['direction']>;
    private align: NonNullable<CarouselOptions['align']>;
    private damping: NonNullable<CarouselOptions['damping']>;
    private disableSnap: NonNullable<CarouselOptions['disableSnap']>;
    private enableVerticalScroll: NonNullable<CarouselOptions['enableVerticalScroll']>;
    private enableNavigationGestures: NonNullable<CarouselOptions['enableNavigationGestures']>;

    private items: HTMLElement[];
    private container: HTMLElement;
    private containerSize = 0;
    private resizeObserver?: ResizeObserver;

    private gap = 0;
    private itemSize: number = 0;
    private itemSizes: Map<number, number> = new Map();
    private itemOffsets: Map<number, number> = new Map();
    private visibleItems: Map<number, { startPos: number; endPos: number }> = new Map();
    // private snapPos = 0;
    private snapPos = 0;
    // private snapPosEnd = 0;
    private autoScroll = 0;
    private activeItemIndexInternal = 0;
    private animationState: AnimationState | null = null;
    private offset = 0;
    private velocity = 0;
    private accel = 0;

    // Quintic animation state
    private quinticPlan: QuinticPlan | null = null;
    private quinticT0 = 0;

    private dragStart: DragStartValue = { t: 0, pos: 0 };
    private dragRegister: DragRegisterValue[] = [];
    private dragScrollLock = false;
    private dragPreventClick = false;

    private rafAutoScroll = 0;
    private rafThrow = 0;
    private rafEased = 0;

    private wheelDisabled = false;
    private wheelInertia = false;
    private wheelData: WheelDataValue[] = [];
    private wheelTimeout = 0;
    private wheelDirection = 0;

    constructor() {
        super();
        const options = JSON.parse(this.dataset.options ?? '{}') as CarouselOptions;
        this.direction = options.direction ?? 'horizontal';
        this.align = options.align ?? 'start';
        this.damping = options.damping ?? 200;
        this.disableSnap = options.disableSnap ?? false;
        this.enableVerticalScroll = options.enableVerticalScroll ?? false;
        this.enableNavigationGestures = options.enableNavigationGestures ?? false;

        const props = JSON.parse(this.dataset.props ?? '{}') as { as: string; itemAs: string };
        const as = props.as ?? 'ul';
        const itemAs = props.itemAs ?? 'li';
        this.container = this.querySelector(`:scope > ${as}`)!;
        this.items = Array.from(this.querySelectorAll(`:scope > ${as} > ${itemAs}`));
    }

    connectedCallback() {
        this.resizeObserver = new ResizeObserver(() => this.refresh());
        this.resizeObserver.observe(this.container);
    }

    disconnectedCallback() {
        this.resizeObserver?.unobserve(this.container);
    }

    moveIntoView(index: number, duration: number = 700) {
        this.stopAllAnimations();
        this.animateEased(this.getClosestDistance(index), index, duration);
    }

    next(duration: number = 700) {
        const index = (this.animationState?.targetIndex ?? this.activeItemIndexInternal) + 1;
        this.animateEasedToIndex(index, duration);
    }

    prev(duration: number = 700) {
        const index = (this.animationState?.targetIndex ?? this.activeItemIndexInternal) - 1;
        this.animateEasedToIndex(index, duration);
    }

    private set disabled(value: boolean) {
        this.container.classList.toggle('disabled', value);
        if (value) {
            this.container.removeEventListener('click', this.handleClickBound);
            this.container.removeEventListener('pointerdown', this.handlePointerDownBound);
            this.container.removeEventListener('wheel', this.handleWheelBound);
        } else {
            this.container.addEventListener('click', this.handleClickBound);
            this.container.addEventListener('pointerdown', this.handlePointerDownBound);
            this.container.addEventListener('wheel', this.handleWheelBound);
        }
    }
    private get disabled() {
        return this.container.classList.contains('disabled');
    }

    private refresh() {
        const values = getCSSValues(this.container, this.direction);
        this.gap = values.gap;
        this.itemSize = values.width;
        this.snapPos = values.snapStart;
        this.disabled = values.disabled;
        if (Math.abs(this.autoScroll) !== Math.abs(values.autoScroll)) {
            this.autoScroll = values.autoScroll;
        }
        if (this.disabled) {
            this.stopAllAnimations();
            this.removePointerEvents();
            this.container.childNodes.forEach(node => {
                (node as HTMLElement).style.transform = '';
            });
            return;
        }
        this.containerSize =
            this.direction === 'horizontal'
                ? this.container.offsetWidth
                : this.container.offsetHeight;

        this.calculateItemSizes();
        this.calculateItemOffsets();
        try {
            this.positionItems();
        } catch (_) {
            console.error('Not enough items to fill available space!');
        }
        // Start or stop auto-scroll animation
        if (this.autoScroll !== 0) {
            this.animateAutoScroll();
        } else {
            this.stopAutoScrollAnimation();
        }
    }

    private updateActiveItemIndex() {
        this.offset = 0;
        this.activeItemIndexInternal = modulo(
            this.animationState?.targetIndex ?? this.activeItemIndexInternal,
            this.items.length
        );
        this.animationState = null;
        this.calculateItemOffsets();
    }

    private calculateItemSizes() {
        this.itemSizes.clear();
        this.container.childNodes.forEach((node, index) => {
            const el = node as HTMLElement;
            const size = this.direction === 'horizontal' ? el.offsetWidth : el.offsetHeight;
            this.itemSizes.set(index, size);
        });
    }

    private calculateItemOffsets() {
        const totalItems = this.items.length;
        const offsets = new Map<number, number>();
        const iActive = this.activeItemIndexInternal;
        if (this.itemSize !== 0) {
            for (let i = 0; i < totalItems; i++) {
                offsets.set(i, (iActive - i) * (this.itemSize + this.gap));
            }
        } else {
            offsets.set(iActive, 0); // Offset of activeItem is by definition 0
            const maxDist = Math.max(iActive, totalItems - iActive);
            for (let i = 1; i < maxDist; i++) {
                const iPrev = iActive - i;
                const iNext = iActive + i;
                if (iPrev >= 0) {
                    const iPrev0 = iPrev + 1;
                    const iPrev0Offset = offsets.get(iPrev0) ?? 0;
                    const neighborOffset = this.getDistanceToNeighbor(iPrev0, 1);
                    const offset = iPrev0Offset + neighborOffset;
                    offsets.set(iPrev, offset);
                }
                if (iNext < totalItems) {
                    const iNext0 = iNext - 1;
                    const iNext0Offset = offsets.get(iNext0) ?? 0;
                    const neighborOffset = this.getDistanceToNeighbor(iNext0, -1);
                    const offset = iNext0Offset + neighborOffset;
                    offsets.set(iNext, offset);
                }
            }
        }
        this.itemOffsets = offsets;
    }

    /**
     * Calculates the pixel distance needed to move from one carousel item to its adjacent neighbor.
     * Accounts for item sizes, gap spacing, and alignment mode (center vs start).
     *
     * @param i - The current item index
     * @param dir - Direction to move: 1 for next item, -1 for previous item
     * @returns Signed distance in pixels (positive or negative based on direction)
     */
    private getDistanceToNeighbor(i: number, dir: number) {
        const totalItems = this.items.length;
        const index = modulo(i, totalItems);
        if (this.align === 'center') {
            const indexNeighbor = modulo(i - dir, totalItems);
            const currHalf = this.getItemSize(index) / 2;
            const nextHalf = this.getItemSize(indexNeighbor) / 2;
            return dir * (this.gap + currHalf + nextHalf);
        } else {
            const indexNeighbor = modulo(i - Math.max(dir, 0), totalItems);
            const size = this.getItemSize(indexNeighbor);
            return dir * (this.gap + size);
        }
    }

    /**
     * Calculates the shortest pixel distance needed to move from the currently active item to a target item.
     * Considers both forward and backward paths through the carousel and chooses the shorter route.
     * Handles circular navigation by allowing wrap-around between first and last items.
     *
     * @param index - The target item index to move to
     * @returns Distance in pixels needed to reach the target item via the shortest path
     */
    private getClosestDistance(index: number): number {
        const totalItems = this.items.length;
        const activeIndex = this.activeItemIndexInternal;
        const i1 = activeIndex > index ? index + totalItems - activeIndex : index - activeIndex;
        const i2 = activeIndex > index ? index - activeIndex : index - totalItems - activeIndex;
        const iDelta = Math.abs(i1) < Math.abs(i2) ? i1 : i2;
        const iDeltaSign = sign(iDelta);
        let distance = 0;
        for (let i = 0; Math.abs(i) < Math.abs(iDelta); i += iDeltaSign) {
            distance += this.getDistanceToNeighbor(activeIndex + i, -iDeltaSign);
        }
        return distance;
    }

    /**
     * Finds the nearest item snap position given a desired movement distance.
     * Steps through neighboring items in the target direction until overshooting,
     * then returns the closest snap position encountered during the search.
     *
     * @param distance - The desired movement distance in pixels from current position
     * @returns Object containing the target item index and actual distance needed to reach it
     */
    private findSnapDistance(distance: number): SnapDistanceResult {
        let index = this.activeItemIndexInternal;
        let offsetTarget = this.offset + distance;
        if (offsetTarget !== 0) {
            // Find the best offset (that is closest to offsetTarget)
            let offsetCurr = 0;
            let offsetDelta;
            let bestOffset = 0;
            let bestIndex = index;
            let bestDiff = Math.abs(offsetTarget);
            const dir = sign(offsetTarget);
            do {
                const distToNeighbor = this.getDistanceToNeighbor(index, dir);
                index -= dir;
                offsetCurr += distToNeighbor;
                offsetDelta = offsetTarget - offsetCurr;
                if (bestDiff > Math.abs(offsetDelta)) {
                    bestDiff = Math.abs(offsetDelta);
                    bestOffset = offsetCurr;
                    bestIndex = index;
                }
            } while (offsetDelta * dir > 0);
            return {
                index: bestIndex,
                distance: bestOffset - this.offset,
            };
        }
        return {
            index,
            distance: -this.offset,
        };
    }

    private getItemSize(index: number): number {
        return this.itemSizes.get(index) ?? 0;
    }

    private getItemOffset(index: number): number {
        return this.itemOffsets.get(index) ?? 0;
    }

    private positionItems() {
        if (!this.container) return;
        const visibleItemsPrev = new Map(this.visibleItems);
        this.visibleItems = new Map();
        const index = this.activeItemIndexInternal;
        const { startEdgePos, endEdgePos } = this.getItemPosition(index);
        this.position(index, startEdgePos, endEdgePos);
        this.positionRight(modulo(index + 1, this.items.length), endEdgePos + this.gap);
        this.positionLeft(modulo(index - 1, this.items.length), startEdgePos - this.gap);
        for (const [index] of visibleItemsPrev) {
            if (!this.visibleItems.has(index)) {
                const node = this.container.childNodes[index] as HTMLElement;
                if (node) {
                    node.style.transform = '';
                }
            }
        }
        this.dispatchEvent(
            new CarouselPositionEvent({
                gap: this.gap,
                snapPosition: this.snapPos,
                containerSize: this.containerSize,
                visibleItems: [...this.visibleItems].map(([index, { startPos, endPos }]) => ({
                    element: this.items[index],
                    index,
                    startPos,
                    endPos,
                })),
            })
        );
    }

    private position(index: number, startEdgePos: number, endEdgePos: number) {
        const isVisible = startEdgePos < this.containerSize && endEdgePos > 0;
        if (isVisible) {
            if (this.visibleItems.has(index)) {
                throw new Error();
            } else {
                this.visibleItems.set(index, { startPos: startEdgePos, endPos: endEdgePos });
                const node = this.container.childNodes[index] as HTMLElement;
                if (node) {
                    node.style.transform =
                        this.direction === 'horizontal'
                            ? `translate3d(${startEdgePos}px, 0, 0)`
                            : `translate3d(0, ${startEdgePos}px, 0)`;
                }
            }
        }
    }

    private positionRight(index: number, startEdgePos: number) {
        while (startEdgePos < this.containerSize) {
            const size = this.getItemSize(index);
            const endEdgePos = startEdgePos + size;
            this.position(index, startEdgePos, endEdgePos);
            index = modulo(index + 1, this.items.length);
            startEdgePos = endEdgePos + this.gap;
        }
    }

    private positionLeft(index: number, endEdgePos: number) {
        while (endEdgePos > 0) {
            const size = this.getItemSize(index);
            const startEdgePos = endEdgePos - size;
            this.position(index, startEdgePos, endEdgePos);
            index = modulo(index - 1, this.items.length);
            endEdgePos = startEdgePos - this.gap;
        }
    }

    private getItemPosition(index: number): ItemPositionResult {
        let startEdgePos, endEdgePos;
        const itemSize = this.getItemSize(index);
        const itemOffset = this.getItemOffset(index);
        const pos = this.offset + this.snapPos - itemOffset;
        if (this.align === 'center') {
            startEdgePos = pos - itemSize / 2;
            endEdgePos = pos + itemSize / 2;
        } else {
            startEdgePos = pos;
            endEdgePos = pos + itemSize;
        }
        return { startEdgePos, endEdgePos };
    }

    /////////////////////////////////////////////////////////////////////////////
    //// POINTER EVENTS, DRAGGING, THROWING
    /////////////////////////////////////////////////////////////////////////////

    private addPointerEvents() {
        window.addEventListener('pointerup', this.handlePointerUpBound);
        window.addEventListener('pointercancel', this.handlePointerCancelBound);
        window.addEventListener('pointermove', this.handlePointerMoveBound);
        const el = this.container;
        if (el) {
            el.addEventListener('touchstart', this.handleTouchStartBound);
            el.addEventListener('touchmove', this.handleTouchMoveBound);
        }
    }

    private removePointerEvents() {
        window.removeEventListener('pointerup', this.handlePointerUpBound);
        window.removeEventListener('pointercancel', this.handlePointerCancelBound);
        window.removeEventListener('pointermove', this.handlePointerMoveBound);
        const el = this.container;
        if (el) {
            el.removeEventListener('touchstart', this.handleTouchStartBound);
            el.removeEventListener('touchmove', this.handleTouchMoveBound);
        }
    }

    private handlePointerDown(event: PointerEvent) {
        if (!event.isPrimary) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        this.stopAllAnimations();
        this.addPointerEvents();
        const pos = this.direction === 'horizontal' ? event.screenX : event.screenY;
        this.dragStart = { t: performance.now(), pos };
        this.dragRegister = [];
        this.dragScrollLock = false;
        this.dragPreventClick = false;
        this.dispatchEvent(new Event('press'));
    }

    private handlePointerUp(event: PointerEvent) {
        if (!event.isPrimary) return;
        this.dragEnd(event);
    }

    private handlePointerCancel(event: PointerEvent) {
        if (!event.isPrimary) return;
        this.dragEnd(event);
    }

    private handlePointerMove(event: PointerEvent) {
        const screenPos = this.direction === 'horizontal' ? event.screenX : event.screenY;
        if (!event.isPrimary) return;
        if (!this.dragScrollLock) {
            // Dragged horizontally for at least 5px: This is a legit swipe.
            // Prevent-default touchmoves to stop browser from taking over.
            const distTotal = Math.abs(screenPos - this.dragStart.pos);
            const isDrag = distTotal >= 5;
            if (isDrag) {
                this.dragScrollLock = true;
                this.dispatchEvent(new Event('drag'));
            }
        }
        if (this.dragScrollLock) {
            // This needs to be set, otherwise we won't get pointer up/cancel
            // events when the mouse leaves the window on drag
            this.container.setPointerCapture(event.pointerId);
        }
        // Determine current position and velocity:
        const prev = last(this.dragRegister) || this.dragStart;
        const t = performance.now();
        const pos = screenPos;
        const dt = t - prev.t;
        const dpos = pos - prev.pos;
        if (dpos !== 0) {
            this.dragRegister.push({ t, pos, dt, dpos });
            this.offset += dpos;
            this.positionItems();
        }
    }

    private handleTouchStart(event: TouchEvent) {
        if (
            !this.enableNavigationGestures &&
            this.direction === 'horizontal' &&
            event.touches.length === 1
        ) {
            const { pageX } = event.touches[0];
            if (pageX < 30 || pageX > window.innerWidth - 30) {
                // Prevent navigation gestures from edges of screen
                event.preventDefault();
            }
        }
    }

    private handleTouchMove(event: TouchEvent) {
        if (this.dragScrollLock) {
            // Prevent-default touchmove events:
            // - Browser won't scroll and take over the pointer
            // - Pointer events continue to be dispatched to us
            if (event.cancelable) event.preventDefault();
        }
    }

    private handleClick(event: MouseEvent) {
        if (this.dragPreventClick && !this.disabled) {
            // Prevent-default click events:
            // After dragging, we don't want a dangling click to go through
            event.stopPropagation();
            event.preventDefault();
        }
    }

    private dragEnd(event: PointerEvent) {
        // Clean up:
        this.dragScrollLock = false;
        this.container.releasePointerCapture(event.pointerId);
        this.removePointerEvents();
        // Discard first sample
        this.dragRegister.shift();
        // Discard zero dt values
        this.dragRegister = this.dragRegister.filter(sample => sample.dt > 0);
        // Calculate total distance the pointer moved
        const distance = this.dragRegister.reduce((a, sample) => a + Math.abs(sample.dpos), 0);
        // Calculate age of last pointer move
        const currentTime = performance.now();
        const lastTime = last(this.dragRegister)?.t ?? currentTime;
        const dt = currentTime - lastTime;
        if (distance < 1 && dt >= 50) {
            // This was a long click:
            // Block clicks, snap to nearest item and bail out.
            this.dragPreventClick = true;
            this.dragThrow(0, 0);
            return;
        }
        // Require at least 2 samples (3 with the discarded first sample)
        // and at least 1px of total pointer movement (to weed out clicks)
        if (this.dragRegister.length >= 2 && distance >= 1) {
            // Block clicks
            this.dragPreventClick = true;
            // Latest sample must be less than 50ms old
            if (dt < 50) {
                // Determine velocity v0:
                // Average the last max 5 sample velocities.
                // Latest samples are applied a smaller weight than older ones
                // because velocity in the last one or two frames tends to
                // decrease significantly
                const relevantSamples = this.dragRegister.slice(-5).reverse();
                let v0 = 0;
                let weightSum = 0;
                relevantSamples.forEach((sample, i) => {
                    v0 += ((i + 1) * sample.dpos) / sample.dt;
                    weightSum += i + 1;
                });
                v0 /= weightSum;
                this.dragThrow(v0, lastTime);
                return;
            }
        }
        // Snap to nearest item
        this.dragThrow(0, 0);
    }

    private dragThrow(v0: number, t0: number) {
        if (Math.abs(v0) > 0.1 && this.damping > 0) {
            // Throw it!
            this.animateThrow(v0, t0);
        } else {
            // This was not a throw.
            if (this.shouldStartAutoScroll()) {
                // Auto scroll
                this.animateAutoScroll();
            } else if (!this.disableSnap) {
                // Snap back
                let { distance, index } = this.findSnapDistance(0);
                this.animateEased(this.offset + distance, index);
            }
        }
    }

    /////////////////////////////////////////////////////////////////////////////
    //// ANIMATIONS
    /////////////////////////////////////////////////////////////////////////////

    private stopAutoScrollAnimation() {
        window.cancelAnimationFrame(this.rafAutoScroll);
        this.rafAutoScroll = 0;
    }

    private stopThrowAnimation() {
        cancelAnimationFrame(this.rafThrow);
        this.rafThrow = 0;
    }

    private stopEasedAnimation() {
        cancelAnimationFrame(this.rafEased);
        this.rafEased = 0;
        this.quinticPlan = null;
    }

    private stopAllAnimations() {
        this.stopAutoScrollAnimation();
        this.stopThrowAnimation();
        this.stopEasedAnimation();
    }

    private shouldStartAutoScroll() {
        return this.autoScroll !== 0 && !this.disabled && !this.rafAutoScroll;
    }

    private animateAutoScroll(v0: number = 0, tweenDuration: number = 500) {
        if (!this.shouldStartAutoScroll()) {
            return;
        }
        const startTime = performance.now();
        const endTime = startTime + tweenDuration;
        let lastTime = startTime;
        const loop = () => {
            const currentTime = performance.now();
            const v = hermite(currentTime, v0, this.autoScroll, startTime, endTime);
            this.offset += (currentTime - lastTime) * v;
            this.positionItems();
            lastTime = currentTime;
            this.rafAutoScroll = requestAnimationFrame(loop);
        };
        this.rafAutoScroll = requestAnimationFrame(loop);
    }

    /**
     * Plan a quintic (5th-degree) trajectory that matches position, velocity, and acceleration
     * at t=0 and t=duration. Duration is in milliseconds.
     */
    private planQuintic(start: QuinticState, end: QuinticState, duration: number): QuinticPlan {
        const dur = Math.max(1, duration); // avoid zero / crazy small
        const T = dur / 1000; // seconds
        const T2 = T * T,
            T3 = T2 * T,
            T4 = T3 * T,
            T5 = T4 * T;

        // Base coefficients from start state
        const a0 = start.x;
        const a1 = start.v;
        const a2 = start.a / 2;

        // Convenience residuals (what the last 3 coeffs must achieve)
        const C0 = end.x - (a0 + a1 * T + 0.5 * start.a * T2);
        const C1 = end.v - (a1 + start.a * T);
        const C2 = end.a - start.a;

        // Solve for a3..a5 (closed-form)
        const a3 = (10 * C0 - 4 * C1 * T + 0.5 * C2 * T2) / T3;
        const a4 = (-15 * C0 + 7 * C1 * T - C2 * T2) / T4;
        const a5 = (6 * C0 - 3 * C1 * T + 0.5 * C2 * T2) / T5;

        function sample(elapsed: number): QuinticState & { done: boolean } {
            const t = Math.max(0, Math.min(T, (elapsed || 0) / 1000)); // seconds, clamped
            const t2 = t * t,
                t3 = t2 * t,
                t4 = t3 * t,
                t5 = t4 * t;

            const x = a0 + a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5;
            const v = a1 + 2 * a2 * t + 3 * a3 * t2 + 4 * a4 * t3 + 5 * a5 * t4; // /s
            const a = 2 * a2 + 6 * a3 * t + 12 * a4 * t2 + 20 * a5 * t3; // /s^2

            return { x, v, a, done: elapsed >= dur - 0.5 };
        }

        return { durationMs: dur, coeffs: [a0, a1, a2, a3, a4, a5], sample };
    }

    private quinticTick(now: number) {
        if (!this.quinticPlan) {
            this.rafEased = 0;
            return;
        }

        const { x, v, a, done } = this.quinticPlan.sample(now - this.quinticT0);
        this.offset = x;
        this.velocity = v;
        this.accel = a;
        this.positionItems();

        if (!done) {
            this.rafEased = requestAnimationFrame(this.quinticTickBound);
        } else {
            this.rafEased = 0;
            this.quinticPlan = null;
            this.updateActiveItemIndex();
        }
    }

    private animateEased(targetOffset: number, targetIndex: number, duration = 1000) {
        const now = performance.now();

        if (this.animationState?.trigger === 'animateThrow') {
            this.stopThrowAnimation();
        }

        const endState = { x: targetOffset, v: 0, a: 0 };
        const startState = this.quinticPlan
            ? this.quinticPlan.sample(now - this.quinticT0) // sample current pos/v/a on the fly
            : { x: this.offset, v: this.velocity, a: this.accel };

        this.quinticT0 = now;
        this.quinticPlan = this.planQuintic(startState, endState, duration);

        this.animationState = { targetIndex, targetOffset, trigger: 'animateEased' };

        const indexMod = modulo(targetIndex, this.items.length);
        this.dispatchEvent(
            new CarouselSnapEvent({
                index: indexMod,
                element: this.items[indexMod],
            })
        );

        if (duration === 0) {
            this.offset = targetOffset;
            this.velocity = 0;
            this.accel = 0;
            this.updateActiveItemIndex();
            this.positionItems();
            return;
        }

        if (!this.rafEased) {
            this.rafEased = requestAnimationFrame(this.quinticTickBound);
        }
    }

    private animateEasedToIndex(targetIndex: number, duration: number = 700) {
        let targetOffset = 0;
        const dir = sign(targetIndex - this.activeItemIndexInternal);
        for (let i = this.activeItemIndexInternal; i !== targetIndex; i += dir) {
            targetOffset -= this.getDistanceToNeighbor(i, dir);
        }
        this.animateEased(targetOffset, targetIndex, duration);
    }

    private animateThrow(v0: number, t0: number) {
        const startPos = this.offset;

        // See https://www.desmos.com/calculator/uejv80whgp for the math
        let index: number;
        let velocity = v0;
        let duration = -this.damping * Math.log(6 / (1000 * Math.abs(v0)));
        let distance = v0 * this.damping * (1 - Math.exp(-duration / this.damping));
        if (!this.disableSnap && this.autoScroll === 0) {
            const { index: iSnap, distance: dSnap } = this.findSnapDistance(distance);
            velocity = dSnap / (this.damping * (1 - Math.exp(-duration / this.damping)));
            duration = -this.damping * Math.log(6 / (1000 * Math.abs(velocity)));
            distance = dSnap;
            index = iSnap;
            this.animationState = {
                targetIndex: index,
                targetOffset: startPos + distance,
                trigger: 'animateThrow',
            };
            const indexMod = modulo(index, this.items.length);
            this.dispatchEvent(
                new CarouselSnapEvent({
                    index: indexMod,
                    element: this.items[indexMod],
                })
            );
        }

        if (sign(velocity) !== sign(this.autoScroll)) {
            // Reverse auto-scroll direction if it goes in the
            // opposite direction of the throw.
            this.autoScroll *= -1;
        }

        const loop = () => {
            const currentTime = performance.now();
            const elapsedTime = currentTime - t0;
            const exp = Math.exp(-elapsedTime / this.damping);
            const v = velocity * exp;
            if (this.shouldStartAutoScroll()) {
                // If auto-scroll is enabled, and the velocity of the
                // throw gets smaller than the auto-scroll velocity,
                // auto-scroll takes over.
                if (Math.abs(v) <= Math.abs(this.autoScroll)) {
                    this.rafThrow = 0;
                    this.animateAutoScroll(v, 1000);
                    return;
                }
            }
            // Total distance traveled until now
            const d = velocity * this.damping * (1 - exp);
            // Exit condition: We're either
            // - sufficiently near the target (normal exit)
            // - or out of time (fail-safe)
            const isNearTarget = Math.abs(distance - d) < 0.1;
            const isOutOfTime = elapsedTime >= duration;
            if (isNearTarget || isOutOfTime) {
                this.rafThrow = 0;
                if (typeof index !== 'undefined') {
                    this.updateActiveItemIndex();
                }
                this.positionItems();
                this.animateAutoScroll();
            } else {
                this.rafThrow = requestAnimationFrame(loop);
                this.offset = startPos + d;
                this.positionItems();
            }
        };
        loop();
    }

    // ///////////////////////////////////////////////////////////////////////////
    // // MOUSE WHEEL
    // ///////////////////////////////////////////////////////////////////////////

    private isInertia(d: number): boolean {
        const t = performance.now();
        if (this.wheelData.length === 0) {
            this.wheelData = [{ t, d }];
            this.wheelDirection = sign(d);
        } else {
            if (this.wheelDirection !== sign(d)) {
                this.wheelDirection = sign(d);
                this.wheelData = [{ t, d }];
            } else {
                const dt = t - (last(this.wheelData)?.t ?? t);
                this.wheelData.push({ t, dt, d });
            }
        }
        let result = false;
        const sampleSize = 8;
        const len = this.wheelData.length;
        if (len > sampleSize) {
            let signCount = 0;
            let equalCount = 0;
            for (let i = len - sampleSize; i < len; i++) {
                const dPrev = this.wheelData[i - 1].d;
                const dCur = this.wheelData[i].d;
                const dd = dCur - dPrev;
                if (dd === 0) {
                    // Weed out mouse wheels which always emit the same
                    // high delta (usually >= 100)
                    if (Math.abs(dPrev) > 10 && Math.abs(dCur) > 10) {
                        equalCount++;
                    }
                } else if (sign(dd) === this.wheelDirection) {
                    // When actively swiping, the signs of the first dy and
                    // subsequent ddys tend to be the same (accelerate).
                    // When inertia kicks in, the signs differ (decelerate).
                    signCount++;
                }
            }
            // Report inertia, when out of the latest [sampleSize] events
            // - less than [sampleSize / 2] accelerated (most decelerated)
            // - all showed some de-/acceleration for higher deltas
            result = signCount < Math.round(sampleSize / 2) && equalCount !== sampleSize;
        }
        return result;
    }

    private handleWheelTimeout() {
        this.wheelInertia = false;
        this.wheelData = [];
    }

    private handleWheel(event: WheelEvent) {
        if (this.wheelDisabled || this.disabled) return;
        // https://github.com/facebook/react/blob/master/packages/react-dom/src/events/SyntheticEvent.js#L556-L559
        // > Browsers without "deltaMode" is reporting in raw wheel delta where
        // > one notch on the scroll is always +/- 120, roughly equivalent to
        // > pixels. A good approximation of DOM_DELTA_LINE (1) is 5% of
        // > viewport size or ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5%
        // > of viewport size.
        let multiplicator = 1;
        if (event.deltaMode === 1) {
            multiplicator = window.innerHeight * 0.05;
        } else if (event.deltaMode === 2) {
            multiplicator = window.innerHeight * 0.875;
        }
        const dx = event.deltaX * multiplicator;
        const dy = event.deltaY * multiplicator;
        // Calculate angle of the swipe
        // -180 ... -135: left (upper 8th)
        // -135 ... -45: up
        // -45 ... 0: right (upper 8th)
        // 0 ... 45: right (lower 8th)
        // 45 ... 135: down
        // 135 .. 180: left (lower 8th)
        const a = (Math.atan2(dy, dx) * 180) / Math.PI;
        // Go forwards if swiped to the right or down
        // Go backwards if swiped to the left or up
        const forwards = a >= -45 && a <= 135;
        // The distance swiped since last event, with correct sign
        const d = Math.hypot(dx, dy) * (forwards ? 1 : -1);
        // Restrict to horizontal axis (if vertical scroll is disabled)
        const horiz = !((a >= -135 && a <= -45) || (a >= 45 && a <= 135));
        if (horiz || this.enableVerticalScroll) {
            event.preventDefault();
            if (!this.isInertia(d)) {
                // Swipe
                this.stopAllAnimations();
                this.offset -= d;
                this.positionItems();
                this.wheelInertia = false;
            } else if (!this.wheelInertia) {
                // Inertia
                const latestData = last(this.wheelData);
                if (latestData?.dt) {
                    const v0 = -latestData.d / latestData.dt;
                    if (v0 !== 0) {
                        this.animateThrow(v0, performance.now());
                        this.wheelInertia = true;
                    }
                }
            }
        }
        clearTimeout(this.wheelTimeout);
        this.wheelTimeout = window.setTimeout(this.handleWheelTimeoutBound, 100);
    }

    // Bound listeners
    private handleClickBound = this.handleClick.bind(this);
    private handlePointerDownBound = this.handlePointerDown.bind(this);
    private handlePointerUpBound = this.handlePointerUp.bind(this);
    private handlePointerCancelBound = this.handlePointerCancel.bind(this);
    private handlePointerMoveBound = this.handlePointerMove.bind(this);
    private handleTouchStartBound = this.handleTouchStart.bind(this);
    private handleTouchMoveBound = this.handleTouchMove.bind(this);
    private handleWheelBound = this.handleWheel.bind(this);
    private handleWheelTimeoutBound = this.handleWheelTimeout.bind(this);
    private quinticTickBound = this.quinticTick.bind(this);
}
