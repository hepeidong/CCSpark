import { Asset, assetManager, Node, resources, Sprite } from "cc";
import { AutoReleasePool, PoolManager } from "./AutoReleasePool";
import { Loader } from "./Loader";

type LoadRemoteArgs = {
    url: string, options: Record<string, any>, onComplete: (err: Error, asset: Asset) => void
} 

function makeLoadRemoteArgs() {
    const args: LoadRemoteArgs = {
        url: undefined,
        options: undefined,
        onComplete: undefined
    };
    args.url = arguments[0];
    if (typeof arguments[1] === "function") {
        args.onComplete = arguments[1];
    }
    else {
        args.options = arguments[1];
        args.onComplete = arguments[2];
    }
    return args;
}

/**
 * 资源管理模块，资源包的加载管理，资源的加载释放管理都在这个模块里。
 * 所有动态资源都是按照资源包分类，其中resources资源包是默认的资源包，
 * 也可以自定义资源包，具体可以参考引擎文档介绍。此模块会根据每一个资源包构建一个loader，
 * 可以通过createLoader接口创建loader，调用loader里的接口进行资源加载和释放，
 * 默认的resources资源包通过Res.loader获取它的loader。
 * 
 */
export class Res {
    private static _loader: Loader = null;
    private static _loaderPool: Map<string, Loader> = new Map();
    private static _remoteAssetPool: AutoReleasePool;

    constructor() {
        PoolManager.purgePoolManager("remote asset");
        Res._remoteAssetPool = PoolManager.instance.getCurrentPool();
    }

    /**加载resources资源包的资源，如果想要加载其它资源包的资源，请使用:
     * @example Res.getLoader("你的资源包名或者路径"); //返回 Loader 类型对象
     * */
    public static get loader() {
        if (!this._loader) {
            this._loader = new Loader(resources);
        }
        return this._loader;
    }

    /**
     * 对应加载器是否存在
     * @param name 资源包名
     * @returns 
     */
    public static hasLoader(name: string) {
        return this._loaderPool.has(name);
    }

    /**
     * 移除加载器，默认会自动释放资源包的资源
     * @param name 资源包
     * @param release 是否释放该资源包的资源，默认是释放
     */
    public static removeLoader(name: string, release: boolean = true) {
        if (this._loaderPool.has(name)) {
            const loader = this._loaderPool.get(name);
            release && loader.gc();
            assetManager.removeBundle(loader.bundle);
            this._loaderPool.delete(name);
        }
    }

    /**
     * 根据资源包名获取该资源包的一个加载器，用于加载和管理该资源包的资源
     * @param name 
     * @returns 
     */
    public static getLoader(name: string) {
        if (this._loaderPool.has(name)) {
            return this._loaderPool.get(name);
        }
        return null;
    }

    /**
     * 根据资源包名或路径创建该资源包的一个加载器，用于加载和管理该资源包的资源
     * @param nameOrUrl 
     * @example
     * //异步创建
     * Res.createLoader('testBundle').then((loader) => {
     *      this._cacheLoader = loader;
     * }).catch((err) => {
     *      Debug.error(err);
     * });
     * 
     * //同步创建，在async函数采用await同步创建
     * this._cacheLoader = await Res.createLoader('testBundle');
     * 
     * ///////////具体使用//////////////
     * this._cacheLoader.load(); //加载该资源包下的资源
     * this._cacheLoader.clear(); //清理该资源包已经通过load接口加载的动态资源
     * this._cacheLoader.setSpriteFrame(); //使用该资源包的资源给节点设置纹理
     * 
     * @returns 
     */
    public static createLoader(nameOrUrl: string) {
        return new Promise<Loader>((resolve, reject: (err: Error) => void) => {
            const name = nameOrUrl.split('/').pop();
            if (this._loaderPool.has(name)) {
                resolve(this._loaderPool.get(name));
            }
            else {
                assetManager.loadBundle(nameOrUrl, (err, bundle) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const loader = new Loader(bundle);
                    this._loaderPool.set(name, loader);
                    resolve(loader);
                });
            }
        });
    }

    /**
     * 设置节点的纹理资源，该方法传入远程纹理资源的路径，会自动管理纹理资源的释放
     * @param target 目标节点
     * @param remoteUrl 远程纹理资源的路径
     */
    public static setRemoteSpriteFrame(target: Node|Sprite, remoteUrl: string) {
        this.loader.setSpriteFrame(target, remoteUrl);
    }

    /**
     * 使用 url 加载远程资源，例如音频，图片，文本等等。可以调用 clearRemoteAssets 接口释放远程加载的资源。
     * 如果要加载远程的图片资源，请使用 setRemoteSpriteFrame 接口，此接口会自动释放资源，不用再手动调用 clearRemoteAssets 接口释放。
     * @param url 资源的url
     * @param options 一些可选参数
     * @param onComplete 回调，将在场景启动后调用。
     */
    public static loadRemote<T extends Asset>(url: string, options: Record<string, any>, onComplete: (err: Error, asset: T) => void): void;
    public static loadRemote<T extends Asset>(url: string, onComplete: (err: Error, asset: T) => void): void;
    public static loadRemote<T extends Asset>(url: string, options: Record<string, any>): void;
    public static loadRemote<T extends Asset>(url: string): void;	
    public static loadRemote()	 {
        const args = makeLoadRemoteArgs.apply(null, arguments) as LoadRemoteArgs;
        if (args.options) {
            assetManager.loadRemote(args.url, args.options, (err, asset) => {
                this.loadComplete(err, asset, args.onComplete);
            });
        }
        else {
            assetManager.loadRemote(args.url, (err, asset) => {
                this.loadComplete(err, asset, args.onComplete);
            });
        }
    }

    /**清理所有通过loadRemote接口加载的远程的资源，会把引用计数减少1 */
    public static clearRemoteAssets() {
        this._remoteAssetPool.clear();
    }

    private static loadComplete(err: Error, asset: Asset, onComplete: (error: Error, asset: Asset) => void) {
        if (!err) {
            this._remoteAssetPool.add(asset);
        }
        onComplete?.(err, asset);
    }
}