import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { Mediator } from "../puremvc";
import { Register } from "../Register/Register";
import { utils, UUID } from "../utils";
import { Assert } from "../exceptions/Assert";
import { IBaseLayout, ILoader, IRegister, IScene, ISceneManager } from "../lib.cck";
import { director, ISchedulable, Node, resources, Scene, Scheduler } from "cc";
import { Res } from "../res/Res";
import { SceneEvent, SceneType } from "./AppEnum";
import { EventSystem } from "../event";
import { CCBaseLayout } from "./CCBaseLayout";


/**
 * author: HePeiDong
 * 
 * date: 2020/5/20
 * 
 * name: 游戏场景状态管理类
 *
 * description: 负责游戏场景的加载，跳转，释放，回退的管理。游戏中场景的跳转，应该写在其子类里，以方便维护，每一个场景都要构建一个子类，用以管理该场景。
 *              必要时，需要指定场景所在的资源包，即便场景资源所在的资源包为resources，也要指定，指定资源包的方式是通过bundle装饰器来指定。
 */
export class SceneBase<T extends IBaseLayout> extends Mediator implements IScene, ISchedulable {
    private _id: string;
    private _uuid: string;
    private _fromAssetBundle: boolean;
    private _sceneName: string;
    private _type: number;
    private _scene: Scene;
    private _canvas: Node;
    private _sceneManager: ISceneManager;
    private _register: Register;
    constructor(sceneName: string, sceneManager: ISceneManager) {
        super(sceneName);
        this._id = "GameScene." + sceneName;
        this._uuid = UUID.randomUUID();
        this._fromAssetBundle = false;
        this._sceneName       = sceneName;
        this._sceneManager    = sceneManager;
        this._register        = new Register();
        Scheduler.enableForTarget(this);
    }

    private get assetPath(): string { return this["_assetPath"]; }
    private get bundleName(): string { return this["_bundleName"]; }

    public get id() { return this._id; }
    public get uuid() { return this._uuid; }
    public get type() { return this._type; }
    public get sceneName() { return this._sceneName; }
    public get canvas() { return this._canvas; }
    protected get view(): T { return this.viewComponent; }
    protected get manager() { return this._sceneManager; }

    public setSceneType() {
        this._type = this.onCreate(this._register);
        const message = `“${this._sceneName}” 场景缺少场景类型，请重写onCreate函数，设置场景类型。`;
        Assert.handle(Assert.Type.InitSceneTypeException, this._type, message);
    }

    public loadScene(onComplete?: Function) {
        if (typeof this.bundleName !== 'string') {
            //没有设置资源包
            this.load(null, onComplete);
        }
        else if (this.bundleName === resources.name) {
            this.load(Res.loader, onComplete);
        }
        else {
            if (Res.hasLoader(this.bundleName)) {
                this.load(Res.getLoader(this.bundleName), onComplete);
            }
            else {
                Res.createLoader(this.bundleName).then(loader => {
                    this.load(loader, onComplete);
                }).catch(e => {
                    Debug.error(e);
                });
            }
        }
    }

    public destroy() {
        EventSystem.event.emit(SceneEvent.DESTROY_SCENE);
        //取消定时器
        director.getScheduler().unscheduleUpdate(this);
        this._scene.destroy();
    }

    public runScene(wait: Node, hasTouchEffect: boolean, ...args: any[]) {
        Debug.log(this.toString(), "运行场景");
        if (this._scene && this._fromAssetBundle) {
            director.runScene(this._scene, null, (err) => {
                if (err) {
                    Debug.error("场景运行错误", err);
                }
            });
        }
        else {
            this._scene = director.getScene();
            this._canvas = this._scene.getChildByName("Canvas");
        }
        EventSystem.event.emit(SceneEvent.RUN_SCENE, hasTouchEffect);
        this.addWaitToCanvas(wait);
        this.onStart(...args);
        //设置update定时器调度
        director.getScheduler().scheduleUpdate(this, -1, false);
    }

    private load(loader: ILoader, onComplete: Function) {
        if (loader) {
            loader.loadScene(this.assetPath, (err, asset) => {
                if (Assert.handle(Assert.Type.LoadSceneException, err, this._sceneName)) {
                    this._fromAssetBundle = true;
                    this.initView(asset.scene);
                    this.onLoad();
                    SAFE_CALLBACK(onComplete);
                }
            });
        }
        else {
            director.loadScene(this.assetPath, () => {
                this.initView(director.getScene());
                this.onLoad();
                SAFE_CALLBACK(onComplete);
            });
        }
    }

    public initView(scene: Scene) {
        this._scene = scene;
        this._canvas = this._scene.getChildByName("Canvas");
        const components = this.canvas.getComponents(CCBaseLayout);
        if (components.length > 0) {
            this.setViewComponent(components[0]);
        }
    }

    private addWaitToCanvas(wait: Node) {
        if (wait)  {
            this.canvas.addChild(wait);
        }
    }

    listNotificationInterests(): string[] {
        return this._register.getNotificationNames();
    }

    handleNotification(notification: INotification): void {
        this._register.handle(notification);
    }

    /**************************周期函数***************************/
    /**
     * 场景类创建时运行，游戏中，一个场景类只会运行一次此函数
     * @param register 注册器，调用注册器的reg函数，注册消息通知
     * @returns 返回当前场景的类型
     * @example
     *  onCreate(register: IRegister) {
     *      register.reg("testNotification", (body: any, type: string) => {
     *          console.log("消息通知传过来的数据", body);
     *      }, this);
     *      return number.Normal;
     * }
     */
    onCreate(register: IRegister): number { return SceneType.NONE; }
    /**
     * 场景加载完调用，只有场景加载后会调用，该函数执行时场景并没有显示，只有onStart才会显示
     */
    onLoad(): void { }
    /**
     * 场景加载成功转换后调用的方法, 可在此做一些资源加载 
     * @example
     *  //可以指定传入的参数和参数类型
     *  onStart(data: any) {
     *      Debug.log("打开场景时传入的数据", data);
     *  }
     */
    onStart(...args: any[]) {}
    /**新的场景启动前调用的方法，会在场景销毁后，以及一系列自动释放资源后调用，可在此做一些资源释放 */
    onEnd() {}
    /**场景状态更新 */
    update(dt: number) {}
    /****************************************************************/

    public toString() {
        return utils.StringUtil.format("[Scene:%s]", this._sceneName);
    }
}
