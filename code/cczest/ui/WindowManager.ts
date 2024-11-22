import { LayerManager } from "./LayerManager"
import { RootManager } from "./RootManager";
import { DialoglManager } from "./DialoglManager";
import { ActivityManager } from "./ActivityManager";
import { ToastManager } from "./ToastManager";
import { TopManager } from "./TopManager";
import { Constructor, IWindowBase } from "../lib.ccspark";
import { WindowLayer } from "./WindowLayer";
import { TouchEffect } from "./TouchEffect";
import { Assert } from "../exceptions/Assert";
import { js, Node } from "cc";
import { app } from "../app";
import { UIType } from "./UIType";
import { EventSystem } from "../event";
import { GameWorldEvent, SceneEvent } from "../app/AppEnum";
import { getPriority } from "../util";
import { Layers } from "cc";




/**
 * author: HePeiDong
 * date: 2020/7/4
 * name: 控制器管理器（即ui管理器）
 * description: 对控制器进行管理。
 */
export class WindowManager {
    private _uiLayer: Layers.Enum;
    private _touchEffect: TouchEffect;
    private _windowLayer: WindowLayer;
    private _managers: LayerManager[];
    constructor() {
        this._uiLayer = Layers.Enum.UI_2D;
        this._touchEffect = new TouchEffect();
        this._windowLayer = new WindowLayer();
        this._managers = [];

        this._managers[UIType.ROOT_LAYER] = new RootManager(true, this._windowLayer);
        this._managers[UIType.DIALOG_LAYER] = new DialoglManager(true, this._windowLayer);
        this._managers[UIType.ACTIVITY_LAYER] = new ActivityManager(true, this._windowLayer);
        this._managers[UIType.TOAST_LAYER] = new ToastManager(false, this._windowLayer);
        this._managers[UIType.TOP_LAYER] = new TopManager(true, this._windowLayer);

        this._touchEffect.initEffectAsset(app.game.sceneManager.getTouchEffectTemp());
        EventSystem.event.on(SceneEvent.CLICK_MASK, this, this.onClickMask);
        EventSystem.event.on(SceneEvent.DESTROY_SCENE, this, this.onDestroyScene);
        EventSystem.event.on(SceneEvent.RUN_SCENE, this, this.onRunScene);
    }

    private static _ins: WindowManager = null;
    public static get instance(): WindowManager {
        return this._ins = this._ins ? this._ins : new WindowManager();
    }

    //点击窗口底部遮罩后执行的事件
    private onClickMask(winType: number) {
        this.delView(winType);
    }
    //场景销毁时的回调
    private onDestroyScene() {
        this.clearAll(true);
    }

    //新的场景运行
    private onRunScene(hasTouchEffect: boolean) {
        this.initWindowLayer(app.game.sceneManager.canvas, hasTouchEffect);
    }

    /**
     * 初始化UI窗口层
     * @param canvas 
     */
    private initWindowLayer(canvas: Node, hasTouchEffect: boolean) {
        this._windowLayer.init(canvas, this._uiLayer);
        if (hasTouchEffect) {
            this._touchEffect.init(this._uiLayer);
        }
    }

    private initView(view: IWindowBase) {
        if (view) {
            const manager: LayerManager = this._managers[view.getViewType()];
            if (manager) {
                manager.set(view);
                manager.initView(view);
            }
        }
    }

    private has(accessId: string) {
        for (const manager of this._managers) {
            if (manager.has(accessId)) {
                return true;
            }
        }
        return false;
    }

    private get(accessId: string) {
        for (const manager of this._managers) {
            if (manager.has(accessId)) {
                return manager.get(accessId);
            }
        }
        return null;
    }

    private retrieveView(accessId: string) {
        let view: IWindowBase;
        if (this.has(accessId)) {
            view = this.get(accessId);
        }
        else {
            const classRef = js.getClassByName(accessId) as Constructor;
            if (Assert.handle(Assert.Type.GetWindowFormClassException, classRef, accessId)) {
                view = new classRef(accessId) as IWindowBase;
                view.iniViewType();
                //最后初始化视图的一些设置，必须要等待视图类型确定后才能进行这部分初始化
                this.initView(view);
            }
        }
        return view;
    }

    private addView(view: IWindowBase, ...args: any[]): void {
        if (view) {
            const manager: LayerManager = this._managers[view.getViewType()];
            if (!manager) {
                return;
            }
            manager.addView(view, ...args);
        }
    }

    /**
     * 设置UI所在的Layer层，如果不设置，则默认为UI_2D
     * @param layer 
     */
    public setUILayer(layer: Layers.Enum) {
        this._uiLayer = layer;
    }

    /**
     * 隐藏指定类型的UI窗口
     * @param winType UI窗口类型
     */
    public setDisappears(winType: number): void {
        this._managers[winType].setDisappears(false);
    }

    /**
     * 设置禁用Toast类型的UI冒泡显示
     * @param disable 为true，则禁用冒泡显示
     */
    public disableBubble(disable: boolean) {
        const manager = this._managers[UIType.TOAST_LAYER] as ToastManager;
        manager.disableBubble(disable);
    }

    /**
     * 把ACTIVITY活动类型的UI窗口压入管理活动窗口的优先队列中，注意，此接口只能用于ACTIVITY活动类型的窗口，
     * 用于其他类型窗口没用作用和效果
     * @param priority 
     * @param accessId 
     */
     public push(priority: number, accessId: string) {
        const view: IWindowBase = this.retrieveView(accessId);
        if (view.getViewType() === UIType.ACTIVITY_LAYER) {
            const manager = this._managers[UIType.ACTIVITY_LAYER] as ActivityManager;
            manager.setPriority(priority, view);
        }
    }

    /**
     * ACTIVITY类型的活动窗口出栈，会根据设定的优先级大小，优先弹出优先级大的窗口，注意，此接口只能用于ACTIVITY活动类型的窗口，
     * 用于其他类型窗口没用作用和效果
     */
    public pop() {
        const manager = this._managers[UIType.ACTIVITY_LAYER] as ActivityManager;
        const activity = manager.popActivity();
        if (activity) {
            if (!app.game.hasMediator(activity.view.accessId)) {
                app.game.registerMediator(activity.view);
            }
            this.addView(activity.view);
        }
    }

    /**
     * 加载页面
     * @param accessId 访问ID
     * @param onProgress 加载进度回调
     * @param onComplete 加载完成回调
     */
    public load(accessId: string, onProgress: (progress: number) => void, onComplete: () => void): void;
    public load(accessId: string, onComplete: () => void): void;
    public load(accessId: string): void;
    public load(): void {
        const accessId = arguments[0];
        let onProgress: (progress: number) => void;
        let onComplete: () => void;
        if (arguments.length === 3) {
            onProgress = arguments[1];
            onComplete = arguments[2];
        }
        else if (arguments.length === 2) {
            onComplete = arguments[1];
        }
        const view = this.retrieveView(accessId);
        view.load(accessId, false, onProgress, onComplete);
    }

    /**
     * 打开页面
     * @param accessId 访问ID
     * @param args 参数列表
     */
     public open(accessId: string, ...args: any[]): void {
        const view = this.retrieveView(accessId);
        if (!app.game.hasMediator(accessId)) {
            app.game.registerMediator(view);
        }
        this.addView(view, ...args);
     }

    public delView(winType: number, isDestroy: boolean = false): boolean {
        const manager: LayerManager = this._managers[winType];
        if (!manager) {
            return false;
        }
        if (manager.getCount() > 0) {
            return manager.delView(isDestroy);
        }
        return false;
    }

    public exitView(view: IWindowBase) {
        const type = view.getViewType();
        if (type === UIType.TOAST_LAYER) {
            //把Toast类型UI放回对象池
            const manager = this._managers[type] as ToastManager;
            manager.put(view);
        }
        else if (type === UIType.ACTIVITY_LAYER) {
            //按照出栈方式以此弹出活动面板
            this.pop();
        }
    }

    public getOpenWinCount(): number {
        let count: number = 0;
        for (let ele of this._managers) {
            count += ele.getCount();
        }
        return count;
    }

    /**
     * 关闭指定类型的所有已经打开了的UI窗口
     * @param winType 指定的UI类型
     */
    public clearOf(winType: number) {
        const manager = this._managers[winType];
        if (manager.getCount() > 0) {
            manager.clear();
        }
    }

    /**
     * 关闭所有类型的已经打开来的UI窗口
     */
    public clear() {
        this.clearAll(false);
    }

    private clearAll(switchingScene: boolean) {
        for (const manager of this._managers) {
            if (manager.getCount() > 0) {
                manager.clear(switchingScene);
            }
        }
    }

    public addToTop(target: Node) {
        this._windowLayer.addToTop(target);
    }

    public shiftMask() {
        for (let i: number = UIType.TOP_LAYER; i >= 1; --i) {
            let win: IWindowBase = this._managers[i].getView();
            if (win) {
                //Toast类型的视图是不会存在遮罩的
                if (win.winModel !== "TOAST") {
                    app.game.sceneManager.addViewMaskTo(win.view.node.parent, win, getPriority(win.view.node) - 1);
                    return;
                }
            }
        }
        app.game.sceneManager.delViewMask();
    }

    public getView<T extends IWindowBase>(accessId: string): T {
        return this.get(accessId) as T;
    }
}

EventSystem.event.once(GameWorldEvent.INIT_GAME, null, () => WindowManager.instance);