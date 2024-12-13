import { EventSystem } from "../event";
import { Facade } from "../puremvc";
import { SceneManager } from "./SceneManager";
import { setParentType } from "../decorator/Decorator";
import { IAssetRegister, IGameWorld, ISceneManager, IViewComplete, IViewProgress, ViewComplete, ViewProgress } from "../lib.zest";
import { director, Game, game, ISchedulable, Prefab, Scheduler } from "cc";
import { STARTUP } from "../Define";
import { UUID } from "../utils";
import { Res } from "../res/Res";
import { GameWorldEvent, GamePlatform } from "./AppEnum";
import { DataSave } from "./file-save";
import { AssetRegister } from "../res/AssetRegister";
import { Asset } from "cc";


/**
 * author: HePeiDong
 * 
 * date: 2019/9/13
 * 
 * name: 游戏主程序类
 * 
 * description: 包含了游戏MVC下主要子程序，负责MVC分配消息给相应的子程序
 */
export class CCGameWorld extends Facade implements IGameWorld, ISchedulable {
    private _id: string;
    private _uuid: string;
    private _versions: string;
    private _startup: boolean;
    private _regUpdated: boolean;
    private _platform: number;
    private _assets: Asset[];
    private _sceneManager: ISceneManager;
    private _assetRegister: AssetRegister;
    private _onViewProgress: IViewProgress<ViewProgress, CCGameWorld>;
    private _onViewComplete: IViewComplete<ViewComplete, CCGameWorld>;
   
    constructor() {
        super();
        this._id = "GameWorld." + STARTUP.name;
        this._uuid = UUID.randomUUID();
        // this._platform   = GamePlatform.PREVIEW;
        this._versions   = '0.0.0';
        this._startup    = false;
        this._regUpdated = false;
        this._assets     = [];
        this._sceneManager    = new SceneManager();
        this._assetRegister   = new AssetRegister();
        this._onViewProgress  = new EventSystem.Signal(this);
        this._onViewComplete  = new EventSystem.Signal(this);
        
        game.on(Game.EVENT_HIDE, this.onBackground, this);
        game.on(Game.EVENT_SHOW, this.onForeground, this);
    }

    private get startScene(): string { return this["_startScene"]; }

    public get id() { return this._id; }
    public get uuid() { return this._uuid; }
    public get platform(): number { return this._platform; }
    public get sceneManager() { return this._sceneManager; }
    public get onViewProgress(): IViewProgress<ViewProgress, CCGameWorld> { return this._onViewProgress; }
    public get onViewComplete(): IViewComplete<ViewComplete, CCGameWorld> { return this._onViewComplete; }


    public static getInstance() {
        return Facade.getInstance() as IGameWorld;
    }

    public init(mask: Prefab, wait: Prefab, touchEffect: Prefab) {
        if (!this._startup) {
            this._startup = true;
            new Res();
            this._assetRegister.setLoader(Res.loader);
            this.listAsset(this._assetRegister);
            DataSave.instance.init();
            this._sceneManager.setMask(mask);
            this._sceneManager.setViewWait(wait);
            this._sceneManager.setTouchEffect(touchEffect);
            EventSystem.event.emit(GameWorldEvent.INIT_GAME);
            //设置初始场景
            this._sceneManager.setScene(this.startScene);
            this._platform = this.startup();
        }
        this.regUpdate();
    }

    /**
     * 设置运行平台
     * @param platform 
     */
    public setPlatform(platform: number) {
        this._platform = platform;
    }

    /**
     * 加载最初始的资源，一般是游戏首页加载的资源，首页加载的资源必须是resources资源包的资源，
     * 在工程的资源管理结构中，resources资源包应该用于存放各个模块都能使用到的公用资源
     * @param onProgress 
     */
    public loadInitialAsset(onProgress: (progress: number) => void) {
        return new Promise<void>((resolve, rejects) => {
            this._assetRegister.loadAssets(onProgress).then(assets => {
                this._assets = assets;
                resolve(null);
            }).catch(e => {
                rejects(e);
            });
        });
    }

    /**
     * 获取指定文件名的游戏初始资源
     * @param filename 
     * @param type 
     * @returns 
     */
    public getInitialAsset<T extends Asset>(filename: string, type: {new (): T}) {
        const assets = this._assets;
        for (const asset of assets) {
            if (asset instanceof type) {
                if (filename === asset.name) {
                    return asset;
                }
            }
        }
        return null;
    }

     /**清理初始加载的资源，即首页资源，会把引用计数减少1，让引擎进行释放检查 */
     public clearInitialingAssets() {
        const assets = this._assets;
        for (const asset of assets) {
            Res.loader.delete(asset);
        }
    }

    private regUpdate() {
        if (!this._regUpdated) {
            this._regUpdated = true;
            const scheduler: Scheduler = director.getScheduler();
            Scheduler.enableForTarget(this);
            scheduler.scheduleUpdate(this, -1, false);
        }
    }

    public setVersions(vs: string) {
        this._versions = vs;
    }

    public getVersions() {
        return this._versions;
    }

    /**列出游戏加载页面需要加载的资源，加载的必须是resources资源包里的资源
     * @example
     *  listAsset(assetRegister: IAssetRegister) {
     *      assetRegister.addFilePath('/目录名/holleworld.png');
     *      assetRegister.addFilePath('/目录名/game.atlas');
     *      assetRegister.addDirPath('/资源目录');
     *  }
     */
    protected listAsset(assetRegister: IAssetRegister) {}

    /**
     * 游戏启动完成，在首场景加载显示后调用
     * @returns 返回游戏所在的平台，请调用app.Platform进行设置
     * @example startup() { return app.Platform.PREVIEW; }
     */
    protected startup(): number{ return GamePlatform.PREVIEW; }
    /**
     * 游戏进入后台 
     * 请注意，在 WEB 平台，这个事件不一定会 100% 触发，这完全取决于浏览器的回调行为。
     * 在原生平台，它对应的是应用被切换到后台事件，下拉菜单和上拉状态栏等不一定会触发这个事件，这取决于系统行为。
     */
    protected onBackground(): void{}
    /**
     * 进入前台 
     * 请注意，在 WEB 平台，这个事件不一定会 100% 触发，这完全取决于浏览器的回调行为。
     * 在原生平台，它对应的是应用被切换到前台事件。
     */
    protected onForeground(): void{}
    /**可以打开Window */
    public canOpenWindow(accessId: string): boolean { return true; }
    /**每一帧刷新的回调 */
    update(dt: number): void {}
}

setParentType("gameWorld", CCGameWorld);