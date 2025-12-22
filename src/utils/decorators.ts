export function Ref(refId: string) {
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get: function (this: HTMLElement): HTMLElement | null {
                const element = this.querySelector<HTMLElement>(`[data-ref="${refId}"]`);
                if (element) {
                    Object.defineProperty(this, propertyKey, {
                        value: element,
                        configurable: true,
                        writable: true,
                    });
                }
                return element;
            },
            enumerable: true,
            configurable: true,
        });
    };
}

export function Refs(refId: string) {
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get: function (this: HTMLElement): HTMLElement[] {
                const elements = [...this.querySelectorAll<HTMLElement>(`[data-ref="${refId}"]`)];
                if (elements.length > 0) {
                    Object.defineProperty(this, propertyKey, {
                        value: elements,
                        configurable: true,
                        writable: true,
                    });
                }
                return elements;
            },
            enumerable: true,
            configurable: true,
        });
    };
}

export function Bind(_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    return {
        get() {
            const boundMethod = originalMethod.bind(this);
            Object.defineProperty(this, propertyKey, {
                value: boundMethod,
                configurable: true,
                writable: true,
            });
            return boundMethod;
        },
        configurable: true,
    };
}

interface ListenerData {
    targetProp: 'this' | 'document' | 'window' | string;
    eventName: string;
    options?: boolean | AddEventListenerOptions;
    propertyKey: string;
}

export function Listen(
    targetProp: ListenerData['targetProp'],
    eventName: ListenerData['eventName'],
    options?: ListenerData['options']
) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._listeners) {
            target.constructor._listeners = [];
        }

        (target.constructor._listeners as ListenerData[]).push({
            targetProp,
            eventName,
            options,
            propertyKey,
        });

        if (!target.constructor._connectedCallbackPatched) {
            const connectedCallbackOriginal = target.connectedCallback;

            target.connectedCallback = function () {
                connectedCallbackOriginal?.call(this);

                const listeners = (this.constructor as any)._listeners as ListenerData[];
                if (listeners) {
                    listeners.forEach(({ targetProp, eventName, options, propertyKey }) => {
                        let eventTarget: EventTarget | undefined;
                        if (targetProp === 'window') eventTarget = window;
                        else if (targetProp === 'document') eventTarget = document;
                        else if (targetProp === 'this') eventTarget = this;
                        else eventTarget = (this as any)[targetProp];
                        if (eventTarget) {
                            const handler = (this as any)[propertyKey];
                            eventTarget.addEventListener(eventName, handler, options);
                        }
                    });
                }
            };

            target.constructor._connectedCallbackPatched = true;
        }

        if (!target.constructor._disconnectedCallbackPatched) {
            const disconnectedCallbackOriginal = target.disconnectedCallback;

            target.disconnectedCallback = function () {
                disconnectedCallbackOriginal?.call(this);

                const listeners = (this.constructor as any)._listeners as ListenerData[];
                if (listeners) {
                    listeners.forEach(({ targetProp, eventName, options, propertyKey }) => {
                        let eventTarget: EventTarget | undefined;
                        if (targetProp === 'window') eventTarget = window;
                        else if (targetProp === 'document') eventTarget = document;
                        else if (targetProp === 'this') eventTarget = this;
                        else eventTarget = (this as any)[targetProp];
                        if (eventTarget) {
                            const handler = (this as any)[propertyKey];
                            eventTarget.removeEventListener(eventName, handler, options);
                        }
                    });
                }
            };

            target.constructor._disconnectedCallbackPatched = true;
        }
    };
}
