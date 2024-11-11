import { AutoReleasePool, PoolManager } from "./AutoReleasePool";
import { AutoRelease } from "./AutoRelease";
import { Asset, AssetManager, Node, SceneAsset, Sprite } from "cc";
import { cc_spark_loader_AssetType, Constructor, ILoader } from "../lib.ccspark";


type LoadArgs = {
    paths: string|string[], 
    type: cc_spark_loader_AssetType, 
    onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, 
    onComplete: (error: Error, assets: Asset|Asset[]) => void
}

type LoadSceneArgs = {
    sceneName: string, 
    options: Record<string, any>,
    onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, 
    onComplete: (error: Error, assets: SceneAsset) => void
}

function makeLoadArgs() {
    const args: LoadArgs = {
        paths: undefined,
        type: undefined,
        onProgress: undefined,
        onComplete: undefined
    };

    args.paths = arguments[0];
    if (arguments[1].prototype instanceof Asset) {
        args.type = arguments[1];
        args.onProgress = arguments[3] ? arguments[2] : undefined;
        args.onComplete = args.onProgress ? arguments[3] : arguments[2];
    }
    else {
        args.onProgress = arguments[2] ? arguments[1] : undefined;
        args.onComplete = args.onProgress ? arguments[2] : arguments[1];
    }
    return args;
}

function makeLoadSceneArgs() {
    const args: LoadSceneArgs = {
        sceneName: undefined,
        options: undefined,
        onProgress: undefined,
        onComplete: undefined
    };
    
    args.sceneName = arguments[0];
    if (typeof arguments[1] === "function") {
        args.onProgress = arguments[2] ? arguments[1] : null;
        args.onComplete = args.onProgress ? arguments[2] : arguments[1];
    }
    else {
        args.options = arguments[1];
        args.onProgress = arguments[3] ? arguments[2] : null;
        args.onComplete = args.onProgress ? arguments[3] : arguments[2];
    }
    return args;
}

/**
 * 资源加载器，加载器与资源包一一对应，每一个资源包都要构建一个加载器，用以管理资源的加载和释放。
 */
export class Loader implements ILoader {
    private _bundle: AssetManager.Bundle;
    private _pool: AutoReleasePool;
    constructor(bundle: AssetManager.Bundle) {
        this._bundle = bundle;
        PoolManager.purgePoolManager(bundle.name);
        this._pool = PoolManager.instance.getCurrentPool();
    }

    /**当前加载器的资源包 */
    public get bundle() { return this._bundle; }


    /**
     * 通过相对路径加载分包中的资源。路径是相对分包文件夹路径的相对路径
     * @param paths 目标资源的路径。路径是相对于捆绑包的文件夹的，必须省略扩展名。
     * @param type 如果提供了此参数，则只加载此类型的资源。
     * @param onProgress 进度更改时调用回调。
     * @param onComplete 当加载所有资源或发生错误时调用的回调。
     */
    public load<T extends Asset>(paths: string, type: cc_spark_loader_AssetType<T>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: T) => void): void;
    public load<T extends Asset>(paths: string[], type: cc_spark_loader_AssetType<T>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    public load<T extends Asset>(paths: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: T) => void): void;
    public load<T extends Asset>(paths: string[], onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    public load<T extends Asset>(paths: string, type: cc_spark_loader_AssetType<T>, onComplete?: (error: Error, assets: T) => void): void;
    public load<T extends Asset>(paths: string[], type: cc_spark_loader_AssetType<T>, onComplete?: (error: Error, assets: Array<T>) => void): void;
    public load<T extends Asset>(paths: string, onComplete?: (error: Error, assets: T) => void): void;
    public load<T extends Asset>(paths: string[], onComplete?: (error: Error, assets: Array<T>) => void): void;	
    public load() {
        const args = makeLoadArgs.apply(null, arguments) as LoadArgs;
        if (args.type) {
            if (args.onProgress) {
                this._bundle.load(args.paths as any, args.type, args.onProgress, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
            else {
                this._bundle.load(args.paths as any, args.type, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
        }
        else {
            if (args.onProgress) {
                this._bundle.load(args.paths as any, args.onProgress, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
            else {
                this._bundle.load(args.paths as any, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
        }
    }

    /**
     *加载目标文件夹中的所有资源, 注意：路径中只能使用斜杠，反斜杠将停止工作
     *@param dir 目标文件夹的路径。路径是相对于捆绑文件夹的，必须省略扩展名。
     *@param type 如果提供了此参数，则只加载此类型的资源。
     *@param onProgress 进度更改时调用回调。
     *@param onComplete 当加载所有资源或发生错误时调用的回调。
     */
    public loadDir<T extends Asset>(dir: string, type: cc_spark_loader_AssetType<T>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    public loadDir<T extends Asset>(dir: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Array<T>) => void): void;
    public loadDir<T extends Asset>(dir: string, type: cc_spark_loader_AssetType<T>, onComplete: (error: Error, assets: Array<T>) => void): void;
    public loadDir<T extends Asset>(dir: string, type: cc_spark_loader_AssetType<T>): void;
    public loadDir<T extends Asset>(dir: string, onComplete: (error: Error, assets: Array<T>) => void): void;
    public loadDir<T extends Asset>(dir: string): void;	
    public loadDir() {
        const args = makeLoadArgs.apply(null, arguments) as LoadArgs;
        if (args.type) {
            if (args.onProgress) {
                this._bundle.loadDir(args.paths as string, args.type, args.onProgress, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
            else {
                this._bundle.loadDir(args.paths as string, args.type, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
        }
        else {
            if (args.onProgress) {
                this._bundle.loadDir(args.paths as string, args.onProgress, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
            else {
                this._bundle.loadDir(args.paths as string, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
        }
    }

    /**
     * 通过场景名称加载分包中的场景。
     * @param sceneName 要加载的场景的名称。
     * @param options 一些可选参数
     * @param onProgress 进度更改时调用回调。
     * @param onComplete 回调，将在场景启动后调用。
     */
    public loadScene(sceneName: string, options: Record<string, any>, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    public loadScene(sceneName: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    public loadScene(sceneName: string, options: Record<string, any>, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    public loadScene(sceneName: string, onComplete: (error: Error, sceneAsset: SceneAsset) => void): void;
    public loadScene(sceneName: string, options: Record<string, any>): void;
    public loadScene(sceneName: string): void;
    public loadScene() {
        const args = makeLoadSceneArgs.apply(null, arguments) as LoadSceneArgs;
        if (args.options) {
            if (args.onProgress) {
                this._bundle.loadScene(args.sceneName, args.options, args.onProgress, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
            else {
                this._bundle.loadScene(args.sceneName, args.options, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
        }
        else {
            if (args.onProgress) {
                this._bundle.loadScene(args.sceneName, args.onProgress, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
            else {
                this._bundle.loadScene(args.sceneName, (err, assets) => {
                    this.loadComplete(err, assets, args.onComplete);
                });
            }
        }
    }

    /**
     * 通过路径与类型获取资源
     * @param path 
     * @param type 
     * @returns 
     */
    public get<T extends Asset> (path: string, type?: Constructor<T>): T {
        return this._bundle.get<T>(path, type);
    }

    /**
     * 强制释放此资源包的所有资源，不会检查引用计数，无法保证依赖资源是否出错
     */
    public gc() {
        this._bundle.releaseAll();
    }

    /**
     * 清理动态加载的所有动态资源，只是会把加载的此资源包的所有引用计数减一
     */
    public clear() {
        this._pool.clear();
    }

    /**
     * 尝试移除单个资源，如果引用计数大于一，则不会被移除
     * @param asset 要删除的资源
     */
    public delete(asset: Asset): boolean {
        return this._pool.delete(asset);
    }

    /**
     * 设置节点的纹理资源，该方法传入当前资源包的资源的路径，会自动管理纹理资源的释放
     * @param target 目标节点
     * @param path 当前资源包的资源的路径
     */
    public setSpriteFrame(target: Node|Sprite, path: string) {
        if (target instanceof Node) {
            this.setSource(path, target);
        }
        else if (target instanceof Sprite) {
            this.setSource(path, target.node);
        }
    }

    private setSource(path: string, target: Node) {
        let autoRelease = target.getComponent(AutoRelease);
        if (!autoRelease) {
            autoRelease = target.addComponent(AutoRelease);
        }
        autoRelease.source(path, this);
    }

    private loadComplete(err: Error, assets: Asset | Asset[], onComplete: (error: Error, assets: Asset|Asset[]) => void) {
        if (!err) {
            if (assets instanceof Array) {
                for (const asset of assets) {
                    this._pool.add(asset);
                }
            }
            else {
                this._pool.add(assets);
            }
        }
        onComplete?.(err, assets);
    }
}

