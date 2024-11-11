import { IListener, ISignal } from "../lib.ccspark";
import { tools } from "../tools";

type PriorityListener<T extends IListener> = {
    priority: number;
    listener: T;
}

/**
 * 信号类, 发射运行状态信号, 更新实体, 组件, 系统的状态
 */
export class CCSignal<T extends IListener, E> implements ISignal<T, E> {
    private _usePriority: boolean;
    private _listeners: tools.Queue<T>|tools.PriorityQueue<PriorityListener<T>>;
    private _context: E;
    constructor(context: E, usePriority: boolean = false) {
        this._context = context;
        this._usePriority = usePriority;
        if (usePriority) {
            this._listeners = new tools.PriorityQueue((a, b) => a.priority > b.priority);
        }
        else {
            this._listeners = new tools.Queue();
        }
    }

    public get active(): boolean { return this._listeners.length > 0; }

    public add(listener: T, priority?: number) {
        if (this._usePriority) {
            (this._listeners as tools.PriorityQueue<PriorityListener<T>>).push({priority, listener});
        }
        else {
            (this._listeners as tools.Queue<T>).push(listener);
        }
    }

    public remove(listener: T) {
        if (this._usePriority) {
            const listeners = this._listeners as tools.PriorityQueue<PriorityListener<T>>;
            for (let i = 0; i < listeners.length; ++i) {
                const e = listeners.back(i);
                if (e.listener === listener) {
                    listeners.delete(i);
                    return true;
                }
            }
            return false;
        }
        else {
            return (this._listeners as tools.Queue<T>).remove(listener);
        }
    }

    public dispatch(...args: any[]) {
        if (this._listeners.length <= 0) return;
        const context = this._context;
        if (this._usePriority) {
            const listeners = this._listeners as tools.PriorityQueue<PriorityListener<T>>;
            listeners.forEach(listener => {
                if (listener.listener && typeof listener.listener === 'function') {
                    listener.listener.apply(context, args);
                }
            });
        }
        else {
            const listeners = this._listeners as tools.Queue<T>;
            listeners.forEach(listener => {
                if (listener && typeof listener === 'function') {
                    listener.apply(context, args);
                }
            });
        }
    }

    public clear() {
        this._listeners.clear();
    }
}