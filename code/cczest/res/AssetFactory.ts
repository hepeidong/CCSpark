import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { ILoader } from "../lib.zest";
import { Asset, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame } from "cc";
import { Res } from "./Res";
import { AssetRegister } from "./AssetRegister";
import { PREVIEW } from "cc/env";

const RESOURCES = resources.name;


/**
 * 游戏资源工厂，用于管理每个模块加载的资源，例如每个UI界面，场景的资源
 * 这些资源将会被资源管理模块管理起来，这个类不应该自己在外部调用
 */
export abstract class AssetFactory {
    
    protected _loader: ILoader;
    protected _finish: number;
    protected _prefabProgress: number;
    protected _assetsProgress: number;
    protected _total: number;
    protected _assetRegister: AssetRegister;
    protected _onProgress: (progress: number) => void;

    private _loadedRes: boolean;           //资源是否加载了
    private _loadedView: boolean;          //预制体是否加载了
    private _bundle: string;
    private _assetPath: string;
    private _prefabAsset: Prefab;
    private _assets: Map<string, Asset[]>;
    
    constructor(bundle: string) {
        this._bundle = bundle;
        this._finish = 0;
        this._prefabProgress = 0;
        this._assetsProgress = 0;
        //最大进度的初始值之所以要为2，是因为所有页面加载，都必须有加载资源包和预制体这两步，
        //其次才是是否有其他资源要加载，即 this._urls 是否不为空
        this._total      = 2;  
        this._loadedRes  = false;
        this._loadedView = false;
        this._assets     = new Map();
        this._assetRegister = new AssetRegister();
    }

    public static create(bundle: string): AssetFactory {
        if (typeof bundle !== 'string') {
            bundle = RESOURCES;
        }
        if (PREVIEW) {
            return new Preview(bundle);
        }
        else {
            return new Build(bundle);
        }
    }

    public get loadedRes() { return this._loadedRes; }
    public get loadedView() { return this._loadedView; }
    public get assetRegister() { return this._assetRegister; }

    protected abstract loadAsset(): Promise<any>;

    /**已经完成了视图的加载，包括依赖资源和视图预制体资源 */
    public isComplete() {
        return this._loadedRes && this._loadedView;
    }

    /**
     * 设置视图预制体资源的路径
     * @param path 路径
     */
    public setViewUrl(path: string) {
        this._assetPath = path;
    }

    public reset() {
        this._loadedRes = false;
        this._loadedView = false;
        this._finish = 0;
        this._total = 2;
        this._assetRegister.reset();
    }

    /**
     * 设置精灵节点的图片纹理
     * @param target 具体要设置的精灵节点
     * @param filename 纹理的文件名
     */
    public setSpriteFrame(target: Node|Sprite, filename: string) {
        if (target instanceof Node) {
            let sprite: Sprite = target.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = this.getGameAsset(filename, SpriteFrame);
            }
        }
        else if (target instanceof Sprite) {
            target.spriteFrame = this.getGameAsset(filename, SpriteFrame);
        }
    }
    
    /**
     * 根据资源名和类型获取资源
     * @param filename 
     * @param type 
     * @returns 
     */
    public getGameAsset<T extends Asset>(filename: string, type: {new (): T}): T { 
        if (this._assets.has(filename)) {
            const list = this._assets.get(filename);
            for (const asset of list) {
                if (asset instanceof type) {
                    if (asset instanceof SpriteAtlas) {
                        const spriteFrame = asset.getSpriteFrame(filename) as unknown;
                        if (spriteFrame) {
                            return spriteFrame as T;
                        }
                    }
                    return asset;
                }
            }
        }
        return null; 
    }

    /**
     * 尝试销毁具体的资源，会减少引用计数，不是直接强制销毁
     * @param asset 
     */
    public delete(asset: Asset) {
        this._loader.delete(asset);
    }

    /**尝试销毁所有依赖的资源，包括视图预制体资源，同样也是减少引用计数，不强制销毁 */
    public clear() {
        this._loader.delete(this._prefabAsset);
        this._assets.forEach((list) => {
            for (const asset of list) {
                this._loader.delete(asset);
            }
        });
        this._prefabAsset = null;
        this._assets.clear();
    }

    /**
     * 加载视图，如果有依赖资源，会和依赖资源一起加载
     * @param onProgress 
     * @returns 
     */
    public loadView(onProgress?: (progress: number) => void) {
        this._onProgress = onProgress;
        return new Promise<Prefab>((resolve) => {
            this.createLoader().then(loader => {
                this._loader = loader;
                this._assetRegister.setLoader(loader);
                this.loadingRes(resolve);
            }).catch(err => {
                Debug.error('加载资源包错误', err);
            });
        });
    }

    private loadingView(resolve: Function) {
        //加载该视图的预制体资源
        if (!this._loadedView) {
            this.loadPrefab().then(asset => {
                this._prefabAsset = asset;
                this._loadedView = true;
                this.loadViewComplete(resolve);
            }).catch(err => {
                Debug.error('加载页面错误', err);
            });
        }
        else {
            this.loadViewComplete(resolve);
        }
    }

    private loadingRes(resolve: Function) {
        //加载视图引用依赖的资源
        if (!this._loadedRes) {
            this.loadAsset().then(() => {
                this._loadedRes = true;
                this.loadingView(resolve);
            }).catch(err => {
                Debug.error('资源加载错误', err);
            });
        }
        else {
            this.loadingView(resolve);
        }
    }

    private loadViewComplete(resolve: Function) {
        if (this.isComplete()) {
            this._finish = this._total;
            SAFE_CALLBACK(this._onProgress, this._finish / this._total);
            resolve(this._prefabAsset);
        }
    }

    private createLoader() {
        return new Promise<ILoader>((resolve, reject) => {
            if (this._bundle === RESOURCES) {
                resolve(Res.loader);
            }
            else {
                if (this._assetRegister.haveVersion) {
                    Res.createLoader(this._bundle, this._assetRegister.version).then(loader => {
                        resolve(loader);
                    }).catch(err => {
                        reject(err);
                    });
                }
                else {
                    Res.createLoader(this._bundle).then(loader => {
                        resolve(loader);
                    }).catch(err => {
                        reject(err);
                    });
                }
            }
        });
    }

    private loadPrefab() {
        return new Promise<Prefab>((resolve, reject) => {
            const prefab = this._loader.get<Prefab>(this._assetPath, Prefab);
            if (prefab) {
                this._finish++;
                SAFE_CALLBACK(this._onProgress, this._finish / this._total);
                resolve(prefab);
            }
            else {
                this._loader.load<Prefab>(this._assetPath, Prefab, (finish, total) => {
                    this._prefabProgress = total > 0 ? finish / total : 0;
                    this._finish = this._prefabProgress + this._assetsProgress;
                    this._onProgress?.(this._finish / this._total);
                }, (err, asset) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(asset);
                });
            }
        });
        
    }

    protected addAssets(assets: Asset | Asset[]) {
        if (assets instanceof Array) {
            for (const asset of assets) {
                this.pushToAssets(asset);
            }
        }
        else {
            this.pushToAssets(assets);
        }
    }

    private pushToAssets(asset: Asset) {
        if (!this._assets.has(asset.name)) {
            this._assets.set(asset.name, [asset]);
        }
        else {
            const list = this._assets.get(asset.name);
            list.push(asset);
            this._assets.set(asset.name, list);
        }
    }
}

/**预览平台下的游戏资源 */
class Preview extends AssetFactory { 

    public loadAsset() {
        // const dirPaths = this.getUrls(this._assetRegister.filePaths);
        // this._assetRegister.dirPaths = this._assetRegister.dirPaths.concat(dirPaths);
        return new Promise<void>((resolve, reject) => {
            this._assetRegister.loadAssets(progress => {
                this._assetsProgress = progress;
                this._finish = this._prefabProgress + this._assetsProgress;
                SAFE_CALLBACK(this._onProgress, this._finish / this._total);
            }).then(assets => {
                this.addAssets(assets);
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    private getUrls(urls: string[]) {
        const result = [];
        const len = urls.length;
        for (let i: number = 0; i < len; ++i) {
            const temp: string[] = urls[i].split('/');
            temp.pop();
            const url = temp.join('/');
            if (result.indexOf(url) === -1 && url.length > 0) {
                result.push(url);
            }
        }

        return result;
    }
}

/**构建后各个平台的游戏资源 */
class Build extends AssetFactory {

    public loadAsset() {
        return new Promise<void>((resolve, reject) => {
            this._assetRegister.loadAssets(progress => {
                this._assetsProgress = progress;
                this._finish = this._prefabProgress + this._assetsProgress;
                SAFE_CALLBACK(this._onProgress, this._finish / this._total);
            }).then(assets => {
                this.addAssets(assets);
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
        
    }
}