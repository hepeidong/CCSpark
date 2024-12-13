import { EventSystem } from "../event";

export class CCObjectPool<T> {
    private _pool: T[];
    private _onClearHandler: EventSystem.Signal<(obj: T) => void, CCObjectPool<T>>;
    constructor() {
        this._pool = [];
    }


    public size(): number { return this._pool.length; }
    public has(): boolean { return this._pool.length > 0; }
    public get onClearHandler(): EventSystem.Signal<(obj: T) => void, CCObjectPool<T>> { 
        if (!this._onClearHandler) {
            this._onClearHandler = new EventSystem.Signal(this);
        }
        return this._onClearHandler; 
    }

    public clear() {
        const onClearHandler = this.onClearHandler;
        if (onClearHandler.active) {
            const len = this._pool.length;
            for (let i: number = 0; i < len; ++i) {
                onClearHandler.dispatch(this._pool[i]);
            }
        }
        this._pool.splice(0, this._pool.length);
    }

    public get() {
        return this._pool.pop();
    }

    public put(e: T) {
        if (e && this._pool.indexOf(e) === -1) {
            this._pool.push(e);
        }
    }
}