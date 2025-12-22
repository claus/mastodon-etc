import { clamp } from '@madeinhaus/utils';
import type { CarouselDirection } from './types';

export type CSSValues = {
    gap: number;
    snap: number;
    snapStart: number;
    snapEnd: number;
    width: number;
    autoScroll: number;
    disabled: boolean;
};

export function getCSSValues(container: HTMLElement, direction: CarouselDirection): CSSValues {
    const GAP = '--carousel-gap';
    const SNAP = '--carousel-snap-position';
    const SNAPSTART = '--carousel-snap-position-start';
    const SNAPEND = '--carousel-snap-position-end';
    const SIZE = '--carousel-item-size';
    const WIDTH = '--carousel-item-width';
    const SCROLL = '--carousel-autoscroll';
    const DISABLED = '--carousel-disabled';
    const styles = [
        `width: 100%`,
        `padding-left: var(${GAP})`,
        `padding-right: var(${SNAP})`,
        `margin-left: var(${SNAPSTART})`,
        `margin-right: var(${SNAPEND})`,
        `left: var(${SIZE}, ${WIDTH})`, // --carousel-item-width is deprecated
    ];
    const isHorizontal = direction === 'horizontal';
    const containerSize = isHorizontal ? container.offsetWidth : container.offsetHeight;
    const dummy = document.createElement('div');
    dummy.setAttribute('style', styles.join(';'));
    const dummyContainer = document.createElement('div');
    dummyContainer.setAttribute('style', `position: absolute; width: ${containerSize}px`);
    dummyContainer.appendChild(dummy);
    container.appendChild(dummyContainer);
    const computed = getComputedStyle(dummy);
    const hasSnapStart = computed.getPropertyValue(SNAPSTART) !== '';
    const hasSnapEnd = computed.getPropertyValue(SNAPEND) !== '';
    const gap = parseFloat(computed.getPropertyValue('padding-left'));
    const snap = parseFloat(computed.getPropertyValue('padding-right'));
    const snapStart = parseFloat(computed.getPropertyValue('margin-left'));
    const snapEnd = parseFloat(computed.getPropertyValue('margin-right'));
    const width = parseFloat(computed.getPropertyValue('left'));
    const autoScroll = parseFloat(computed.getPropertyValue(SCROLL));
    const disabled = parseInt(computed.getPropertyValue(DISABLED), 10);
    container.removeChild(dummyContainer);
    return {
        gap: Math.max(Number.isFinite(gap) ? gap : 0, 0),
        snap: Number.isFinite(snap) ? snap : 0,
        snapStart: hasSnapStart && Number.isFinite(snapStart) ? snapStart : snap,
        snapEnd: hasSnapEnd && Number.isFinite(snapEnd) ? snapEnd : snap,
        width: Math.max(Number.isFinite(width) ? width : 0, 0),
        autoScroll: Number.isFinite(autoScroll) ? autoScroll : 0,
        disabled: (Number.isFinite(disabled) ? disabled : 0) !== 0,
    };
}

export function hermite(
    time: number,
    from: number = 0,
    to: number = 1,
    timeStart: number = 0,
    timeEnd: number = 1
): number {
    time = clamp(time, timeStart, timeEnd);
    const t = (time - timeStart) / (timeEnd - timeStart);
    return (-2 * t * t * t + 3 * t * t) * (to - from) + from;
}
