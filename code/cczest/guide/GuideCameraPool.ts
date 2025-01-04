import { Node } from "cc"

type pool_type = {
    [n: string]: Node;
}

export class GuideCameraPool {
    private _pool: pool_type;
    constructor() {
        this._pool = {};
    }

    private static _ins: GuideCameraPool = null;
    public static get instance() {
        if (!this._ins) {
            this._ins = new GuideCameraPool();
        }
        return this._ins;
    }

    public set(key: string, node: Node) {
        if (!(key in this._pool)) {
            this._pool[key] = node;
        }
    }

    public get(key: string) {
        return this._pool[key];
    }

    public has(key: string) {
        return key in this._pool;
    }

    public clear() {
        const pool = this._pool;
        for (const key in pool) {
            delete pool[key];
        }
    }
}