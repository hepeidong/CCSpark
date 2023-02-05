import { Debug } from "../Debugger";
import { EventSystem } from "../cck";
import { Assert } from "../exceptions/Assert";

export class AutoReleasePool {
    private _name: string;
    private _managedAssetMap: Map<string, cc.Asset>;
    constructor(name: string = null) {
        this._name = name;
        this._managedAssetMap = new Map();
        Assert.instance.handle(Assert.Type.CreateObjectException, this._managedAssetMap, "managedObjectMap");
        PoolManager.instance.push(this);
        PoolManager.instance.onClear.add(() => {
            this.clear();
        });
        Debug.log(this.toString());
    }

    /**
     * 增加资源对象
     * @param asset 资源对象
     */
    public add(asset: cc.Asset): void {
        asset.addRef();
        if (!this._managedAssetMap.has(asset['_uuid'])) {
            this._managedAssetMap.set(asset['_uuid'], asset);
        }
    }

    public getAsset(key: string): cc.Asset {
        return this._managedAssetMap.get(key);
    }

    public has(asset: cc.Asset): boolean {
        return this._managedAssetMap.has(asset['_uuid']);
    }

    public delete(asset: cc.Asset): boolean {
        const key = asset['_uuid'];
        if (this._managedAssetMap.has(key)) {
            const asset = this._managedAssetMap.get(key);
            const flag = asset.refCount <= 1;
            if (asset.refCount > 0) {
                asset.decRef();
            }
            if (flag) {
                this._managedAssetMap.delete(key);
            }
            return true;
        }
        return false;
    }

    public forEach(callback: (asset: cc.Asset, key: string) => void) {
        this._managedAssetMap.forEach(callback);
    }

    /**减少所有动态资源的引用计数 */
    public clear(): void {
        this._managedAssetMap.forEach((asset: cc.Asset) => {
            this.delete(asset);
        });
    }

    public toString() {
        return "autorelease pool " + ": Resource autorelease pool of '" + this._name + "', number of managed asset " + this._managedAssetMap.size;
    }
}

export class PoolManager {
    private _onClear: EventSystem.Signal<IListener, PoolManager>;
    private _releasePoolStack: AutoReleasePool[];
    private static _ins: PoolManager = null;
    private static _name: string;
    constructor() {
        this._onClear = new EventSystem.Signal(this);
        this._releasePoolStack = [];
    }

    public static get instance(): PoolManager {
        if (!this._ins) {
            this._ins = new PoolManager();
            new AutoReleasePool(this._name);
        }
        return this._ins;
    }

    public get onClear() { return this._onClear; }

    public static purgePoolManager(name: string = 'default'): void {
        this.destroyPoolManager(name);
    }

    private static destroyPoolManager(name: string): void {
        this._name = name;
        delete this._ins;
        this._ins = null;
    }

    public getCurrentPool(): AutoReleasePool {
        return this.pop();
    }

    public push(pool: AutoReleasePool): void {
        this._releasePoolStack.push(pool);
    }

    /**减少游戏中所有动态资源的引用计数 */
    public clear() {
        if (this._onClear.active) {
            this._onClear.dispatch();
        }
    }

    private pop(): AutoReleasePool {
        return this._releasePoolStack.pop();
    }
}