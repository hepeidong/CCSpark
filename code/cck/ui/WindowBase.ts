import { AdapterWidget } from "../app/adapter_manager/component/AdapterWidget";
import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { cck_win_model, IAssetRegister, IRegister, IWindowBase } from "../lib.cck";
import { Mediator } from "../puremvc";
import { Register } from "../Register/Register";
import { AssetFactory } from "../res/AssetFactory";
import { utils } from "../utils";
import { Assert } from "../exceptions/Assert";
import { Asset, Component, instantiate, isValid, js, Node, Prefab, Sprite, Tween } from "cc";
import { app } from "../app";
import { UIType } from "./UIType";


/**
 * author: HePeiDong
 * date: 2019/9/13
 * name: 预制体页面控制器基类
 * description: 窗体基类主要完成窗体里公共的底层功能，例如加载，显示，销毁，释放资源 
 */
export class WindowBase<T extends Component> extends Mediator implements IWindowBase {
    private _loading: boolean;             //正在加载视图
    private _isOpen: boolean;              //是否加载完直接打开视图
    private _opened: boolean;              //UI视图已经打开了
    private _isDestroy: boolean;           //是否强制销毁
    private _hasMask: boolean;             //是否增加背景遮罩
    private _canClose: boolean;            //是否允许点击弹窗遮罩任意地方关闭
    private _autoRelease: boolean;         //是否自动释放资源
    private _node: Node;                   //视图节点
    private _viewType: number;             //控制器类型
    private _winModel: cck_win_model;      //窗口模型
    private _args: any[];                  //参数
    private _register: Register;
    private _gameAsset: AssetFactory;

    private _onProgress: (progress: number) => void;   //加载进度回调
    private _onComplete: () => void;                   //加载完成回调
    private _openComplete: Function;                   //打开回调

    constructor(accessId: string) {
        super(accessId);
        this._loading     = false;
        this._opened      = false;
        this._isDestroy   = false;
        this._isOpen      = true;
        this._hasMask     = false;
        this._canClose    = false;
        this._autoRelease = true;
        this._register    = new Register();
        this._gameAsset   = AssetFactory.create(this["_bundleName"]);//_bundleName资源包名
    }

    private get assetPath(): string { return this["_assetPath"]; }//预制体资源路径
    //UI视图名
    public get name(): string { return this.mediatorName; }
    public get view(): T { return this.viewComponent; }
    public get node(): Node { return this._node; }
    /**访问ID */
    public get accessId(): string { return this.getMediatorName(); }
    public get opened(): boolean { return this._opened; }
    public get hasMask(): boolean { return this._hasMask; }
    public get canClose(): boolean { return this._canClose; }
    public get autoRelease(): boolean { return this._autoRelease; }
    public get winModel(): cck_win_model { return this._winModel; }

    public setWinName(name: string): void {
        this.mediatorName = name;
    }

    public getViewType(): number { return this._viewType; }

    /**
     * 是否增加背景遮罩层, 一般会自动设置遮罩层，不需要调用此方法, 特殊页面根据实际情况, 不需要背景遮罩层时, 调用此方法设置
     * @param hasMask 
     */
     public isAddMask(hasMask: boolean) {
        this._hasMask = hasMask;
    }

    /**
     * 是否允许点击任意地方关闭, 默认是允许
     * @param can 
     */
     public isClickAnyClose(can: boolean) {
        this._canClose = can;
    }

    /**
     * 设置自动释放, 通过此接口开启或关闭自动释放资源, 默认是会自动释放资源
     * @param autoRelease 
     */
     public setAutoRelease(autoRelease: boolean) {
        this._autoRelease = autoRelease;
    }

     /**
     * 加载视图
     * @param isOpen 是否加载完后直接打开
     * @param onProgress 进度回调
     */
    public load(accessId: string, isOpen: boolean, onProgress: (progress: number) => void, onComplete: () => void) {
        if (app.game.canOpenWindow(accessId)) {
            this.loadView(isOpen, onProgress, onComplete, false);
        }
    }

    public open(onComplete: Function, ...args: any[]) {
        if (app.game.canOpenWindow(this.accessId)) {
            this._openComplete = onComplete;
            this.showView(...args);
        }
    }

    /**
     * 关闭UI,关闭窗口
     * @param isDestroy 是否强制销毁UI,默认为false,如果强制销毁UI,将不会根据UI类型,选择隐藏方式,直接销毁UI节点,并释放资源
     * @param switchingScene 是否正在切换场景中
     */
     public close(isDestroy: boolean = false, switchingScene: boolean = false) {
        Debug.log(this.toString(), '关闭视图');
        this._isDestroy = isDestroy;
        this._opened = false;
        this._args = undefined;
        if (this._node) {
            this._closeView(switchingScene);
        }
    }

    /**
     * 尝试销毁具体的资源，会减少引用计数，不是直接强制销毁
     * @param asset 
     */
    public deleteAsset(asset: Asset) {
        this._gameAsset.delete(asset);
    }

    /**
     * 设置精灵节点的图片纹理
     * @param target 具体要设置的精灵节点
     * @param filename 纹理的文件名
     */
    public setSpriteFrame(target: Node|Sprite, filename: string) {
        this._gameAsset.setSpriteFrame(target, filename);
    }

    /**
     * 根据资源名和类型获取资源
     * @param filename 
     * @param type 
     * @returns 
     */
    public getGameAsset<T extends Asset>(filename: string, type: {new (): T}): T {
        return this._gameAsset.getGameAsset(filename, type);
    }

    public toString() {
        return utils.StringUtil.format("[WindowBase:%s]", this.name);
    }

    /** 设置UI类型*/
     public iniViewType(): void {
        this._viewType = this.onCreate(this._register);
        const message = "缺少UI界面的类型，请重写onCreate函数，设置UI界面类型。";
        if (Assert.handle(Assert.Type.InitViewTypeException, this._viewType, message)) {
            this._winModel = UIType[this._viewType] as cck_win_model;
        }
    }

    /**具体窗体实现退出的方式，隐藏或者销毁, ui系统调用此函数进行销毁窗体，不能自己手动在外部调用，否则会引发未知错误 */
    protected removeView(): void {
        Tween.stopAllByTarget(this.node);
        this.node.removeFromParent();
        if (!this._isDestroy) {
            if (this.autoRelease) {
                this.destroy();
            }
            else {
                this.hideView();
            }
        }
        else if (this._isDestroy) {
            this.destroy();
        }
        app.game.removeMediator(this.getMediatorName());
        this.onClose();
    }

    protected popupView() {
        this._opened = true;
    }

    listNotificationInterests(): string[] {
        return this._register.getNotificationNames();
    }

    handleNotification(notification: INotification): void {
        this._register.handle(notification);
    }

    /**
     * 加载视图
     * @param isOpen 是否加载完后直接打开
     * @param onProgress 进度回调
     * @param isWait 是否显示等待页面,默认显示
     */
     private loadView(isOpen: boolean, onProgress?: (progress: number) => void, onComplete?: () => void, isWait: boolean = true): void {
        this._isOpen = isOpen;

        if (this._loading) {
            return;
        }
        Debug.log(this.toString(), '加载视图');

        this._loading = true;
        this._onProgress = onProgress;
        this._onComplete = onComplete;
        isWait && this.showWait();

        this._gameAsset.setViewUrl(this.assetPath);
        this.listAssetUrls(this._gameAsset.assetRegister);
        this._gameAsset.loadView(this.loadProgress.bind(this)).then(this.loadViewComplete.bind(this));
    }

    /**打开视图 */
    private showView(...args: any[]): void {
        if (this._opened) {
            return;
        }
        if (!this._gameAsset.isComplete()) {
            this._args = args;
            this.loadView(true);
        }
        else {
            this.openView(...args);
        }
    }

    private hideView(): void {
        this._node.active = false;
        this._opened = false;
    }

    private destroy(): void {
        Debug.log(this.toString(), '销毁视图');
        if (isValid(this.node, true)) {
            this.node.destroy();
        }
        this.reset();
        this.removeCommand();
        this.onDestroy();
    }

    /**打开窗口 */
    private openView(...args: any[]) {
        this._args = args;
        SAFE_CALLBACK(this._openComplete);
        const onViewComplete = app.game.onViewComplete;
        if (onViewComplete.active) {
            onViewComplete.dispatch();
        }
        this.closeWait();
        this._node.active = true;
        this.onStart(...args);
        this._openView();
    }

    private registerCommand() {
        const commands = this._register.getCommands();
        for (const command of commands) {
            const commandRef = js.getClassByName(command) as typeof app.Command|typeof app.CommandGroup;
            if (Assert.handle(Assert.Type.GetCommandClassException, commandRef, command)) {
                commandRef.addRef();
                if (!app.game.hasCommand(command)) {
                    app.game.registerCommand(command, commandRef);
                }
            }
        }
    }

    private removeCommand() {
        const commands = this._register.getCommands();
        for (const command of commands) {
            const commandRef = js.getClassByName(command) as typeof app.Command|typeof app.CommandGroup;
            if (Assert.handle(Assert.Type.GetCommandClassException, commandRef, command)) {
                commandRef.delRef();
                if (commandRef.getRef() === 0) {
                    app.game.removeCommand(command);
                }
            }
        }
    }

    /***************控制器生命周期函数***************/
    /**
     * 视图类实例化后调用，界面被创建对象后调用，有且只会调用一次，必需要return一个界面类型，用于确定界面的类型 
     * @param register 注册器，调用注册器的reg函数，注册消息通知
     * @example
     *  protected onCreate(register: IRegister) {
     *      register.reg("testNotification", (body: any, type: string) => {
     *          console.log("消息通知传过来的数据", body);
     *      }, this);
     *      register.addCommand("你的命令");
     *      return ui.Type.ROOT_LAYER;
     * }
     */
    protected onCreate(register: IRegister): number { return UIType.NONE; }
    /**
     * 视图加载完调用，只有加载后会调用，如果界面后续没有被销毁，再次打开时，不会再调用此函数，反之则会调用
     */
    protected onLoad(): void { }
    /**
     * 视图显示后调用，每次打开界面显示后都会调用
     * @example
     *  //可以指定传入的参数和参数类型
     *  onStart(data: any) {
     *      Debug.log("打开页面时传入的数据", data);
     *  }
     */
    protected onStart(...args: any[]): void { }
    /**视图关闭后调用，界面关闭后调用，此函数无论在界面关闭时是否被销毁，都会被调用，而且调用时机是后于onDestroy调用 */
    protected onClose(): void { }
    /**视图销毁后调用，界面销毁后调用，调用时机先于onClose调用 */
    protected onDestroy(): void { }

    /**
     * 列出资源的url，把需要引用到的资源的url注册增加到assetRegister，则会自动加载这些资源
     * @example
     *  lisAssetUrls(assetRegister: IAssetRegister) {
     *      assetRegister.addFilePath('/目录名/holleworld.png');
     *      assetRegister.addFilePath('/目录名/game.atlas');
     *      assetRegister.addDirPath('/资源目录');
     *  }
     */
    listAssetUrls(assetRegister: IAssetRegister): void { }

    /***********************************************/
    
     /**显示加载等待页面, 这是多态方法, 加载页面时会自动调用, 可以自行重写覆盖 */
    protected showWait() {}
     /**关闭加载等待页面, 这是多态方法, 页面加载完会自动调用, 可以自行重写覆盖 */
    protected closeWait() {}
    /**具体ui窗体子类不要重写此函数 */
    protected _loadView() {}
    /**具体ui窗体子类不要重写此函数 */
    protected _openView() {}
    /**具体ui窗体子类不要重写此函数 */
    protected _closeView(switchingScene: boolean) {}

    /**
     * 此方法会适配页面的根节点大小, 如果页面根节点增加了AdapterWidget适配组件, 会打断适配过程
     */
     protected initPageSize() {
        if (!this.node.getComponent(AdapterWidget) && this._viewType !== UIType.TOAST_LAYER) {
            app.adapterManager.adapterWidth(this.node);
            app.adapterManager.adapterHeight(this.node);
        }
     }

     /**视图和资源已经加载完成 */
    private loadViewComplete(asset: Prefab) {
        this._node = instantiate(asset);
        this._node.active = false;
        this.initPageSize();
        this._loadView();

        SAFE_CALLBACK(this._onComplete);
        this.registerCommand();
        this.onLoad();
        this.alreadyLoaded();
    }

    private reset() {
        this._node = null;
        this._loading = false;
        this._isOpen = true;
        this._isDestroy = false;
        this._gameAsset.reset();
        this._gameAsset.clear();
    }

    private alreadyLoaded(): void {
        if (this._isOpen) {
            this.openView(...this._args);
        }
    }

    /**
     * 视图加载进度
     * @param progress 具体进度，最大为1
     */
    private loadProgress(progress: number) {
        if (this._viewType !== UIType.ROOT_LAYER) {
            const onViewProgress = app.game.onViewProgress;
            if (onViewProgress.active) {
                onViewProgress.dispatch(progress);
            }
        }
        SAFE_CALLBACK(this._onProgress, progress);
    }
}
