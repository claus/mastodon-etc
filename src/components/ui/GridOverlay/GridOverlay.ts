import { Listen, Bind, Ref } from '@/utils/decorators';

export default class GridOverlay extends HTMLElement {
    @Ref('grid')
    declare protected grid: HTMLElement;

    @Bind
    @Listen('document', 'keypress')
    protected handleKeypress(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        if (event.key === 'g' && target.nodeName !== 'INPUT') {
            this.grid.classList.toggle('visible');
        }
    }
}
