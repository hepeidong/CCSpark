import { Button, instantiate, js, Node, Prefab } from "cc";
import { Constructor, IScene, ISceneManager, IWindowBase } from "../lib.ccspark";
import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";
import { EventSystem } from "../event";
import { SceneEvent, GameSceneType } from "./AppEnum";
import { CCGameWorld } from "./CCGameWorld";
import { setPriority } from "../util";
import { director } from "cc";

export class SceneManager implements ISceneManager {
    private _hasTouchEffect: boolean;
    private _maskTemp: Node;
    private _waitTemp: Node;
    private _mask: Node;     //UI界面的底部遮罩
    private _wait: Node;     //UI界面加载时的等待界面
    private _maskInPage: IWindowBase;   //底部遮罩所在的界面
    private _touchEffectTemp: Prefab;
    private _scene: IScene;
    private _sceneStack: IScene[];
    constructor() {
        this._hasTouchEffect = false;
        this._sceneStack = [];
    }

    public get canvas() { return this._scene.canvas; }

    public getTouchEffectTemp() { return this._touchEffectTemp; }

    public setTouchEffect(prefab: Prefab) {
        this._touchEffectTemp = prefab;
        if (prefab) {
            this._hasTouchEffect = true;
        }
    }

    public setMask(temp: Prefab) {
        if (temp instanceof Prefab) {
            this._maskTemp = instantiate(temp);
        }
    }

    public addViewMaskTo(parent: Node, page: IWindowBase, zIndex: number) {
        this._maskInPage = page;
        this.instantiateMask();
        if (this._mask) {
            this._mask.active = true;
            this._mask.removeFromParent();
            parent.addChild(this._mask);
            setPriority(this._mask, zIndex);
        }
    }

    public delViewMask() {
        if (this._mask) {
            this._mask.removeFromParent();
            this._mask.active = false;
        }
    }

    public setViewWait(temp: Prefab) {
        if (temp instanceof Prefab) {
            this._waitTemp = instantiate(temp);
        }
    }

    public showWaitView() {
        this.instantiateWait();
        this._wait && (this._wait.active = true);
    }

    public hideWaitView() {
        this._wait && (this._wait.active = false);
    }

    /**
     * 设置将要显示的场景，会对即将要显示俄场景进行加载，以及释放当前场景及其可以释放的资源
     * @param sceneName 场景名
     * @param args 需要传递给即将要显示的场景的数据
     */
    public setScene(sceneName: string, ...args: any[]) {
        //在跳转新的场景前, 运行onEnd回调
        if (this._scene) {
            if (this._scene.sceneName !== sceneName) {
                this._scene.onEnd();
                /**
                 * 只有普通场景会销毁，并尝试释放资源，过渡类型场景不会被销毁。
                 * 过渡类型场景一般用于切换场景时加载资源等等场合。
                */
                if (this._scene.type === GameSceneType.Normal) {
                    this._scene.destroy();
                }
                if (CCGameWorld.getInstance().hasMediator(sceneName)) {
                    this._scene = CCGameWorld.getInstance().retrieveMediator(sceneName) as IScene;
                }
                else {
                    this.createScene(sceneName);
                }
                this.loadScene(...args);
            }
            else {
                Debug.warn(`场景 ${sceneName} 已经打开了`);
            }
        }
        //初始场景不需要加载, 游戏进入会直接显示
        else {
            this.createScene(sceneName);
            this._scene.initView(director.getScene());
            this._scene.onLoad();
            this.runScene(...args);
        }
    }

    /**
     * 场景回退到上一个，如果当前是初始场景，则什么都不会发生，如果是过渡类型的场景，则会被跳过
     * @param args 传递给即将要回退到的那个场景的数据
     */
    public backScene(...args: any[]) {
        if (this._sceneStack.length > 1) {
            //把当前场景出栈
            this._sceneStack.pop();
            //上一个场景出栈，并把它设置为要加载和显示的场景
            let scene = this._sceneStack.pop();
            while(this._sceneStack.length > 0 && scene.type === GameSceneType.Interim) {
                scene = this._sceneStack.pop();
            }
            if (scene.type === GameSceneType.Normal) {
                this.setScene(scene.sceneName, ...args);
            }
        }
        else {
            Debug.warn("没有场景可以回退");
        }
    }

    private instantiateWait() {
        let flag = false;
        if (this._wait) {
            if (!this._wait.isValid) {
                flag = true;
            }
        }
        else {
            if (this._waitTemp) {
                flag = true;
            }
        }
        if (flag) {
            this._wait = instantiate(this._waitTemp);
            this.canvas.addChild(this._wait);
            setPriority(this._wait, 99999);
            this._wait.active = false;
        }
    }

    private instantiateMask() {
        let flag = false;
        if (this._mask) {
            if (!this._mask.isValid) {
                flag = true;
            }
        }
        else {
            if (this._maskTemp) {
                flag = true;
            }
        }
        if (flag) {
            this._mask = instantiate(this._maskTemp);
            if (!this._mask.getComponent(Button)) {
                this._mask.addComponent(Button);
            }
            EventSystem.click(this._mask, this, this.closeView);
        }
    }

    private createScene(sceneName: string) {
        const classRef = js.getClassByName(sceneName) as Constructor;
        if (Assert.handle(Assert.Type.GetSceneClassException, classRef, sceneName)) {
            const scene = new classRef(sceneName, this) as IScene;
            scene.setSceneType();
            CCGameWorld.getInstance().registerMediator(scene);
            this._scene = scene;
        }   
    }

    //TODO 场景加载需要继续修改
    private loadScene(...args: any[]) {
        this._scene.loadScene(() => {
            this.runScene(...args);
        });
    }

    private runScene(...args: any[]) {
        this._sceneStack.push(this._scene);
        //运行场景当前设置的场景，传入数据，会给运行起来的场景传递数据
        this.instantiateWait(); //重新初始化等待页面，因为场景发生了切换，势必会造成某些节点被销毁
        this._scene.runScene(this._wait, this._hasTouchEffect, ...args);
    }

    private closeView() {
        if (this._maskInPage.canClose) {
            EventSystem.event.emit(SceneEvent.CLICK_MASK, this._maskInPage.getViewType());
        }
    }
}