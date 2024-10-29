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
            for (let i: number = 0; i < this._pool.length; ++i) {
                onClearHandler.dispatch(this._pool[i]);
            }
        }
        this._pool.length = 0;
    }

    public get() {
        let last: number = this._pool.length - 1;
        if (last < 0) {
            return null;
        }
        else {
            let e: T = this._pool[last];
            this._pool.length = last;
            return e;
        }
    }

    public put(e: T) {
        if (e && this._pool.indexOf(e) === -1) {
            this._pool.push(e);
        }
    }
}