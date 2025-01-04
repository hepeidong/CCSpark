import { UITransform, v3, Vec3 } from "cc";
import { IWindowBase } from "zest";
import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";
import { LayerManager } from "./LayerManager";
import { WindowLayer } from "./WindowLayer";
import { tools } from "../tools";

const _vec3Temp = v3();

/**
 * author: HePeiDong
 * 
 * date: 2020/7/4
 * 
 * name: Toast提示视图ui管理器
 * 
 * description: 队列存储方式。
 */
export  class ToastManager extends LayerManager {
    private _disable: boolean;
    private _tempVec: Vec3;
    private _originYMap: Map<string, number>;
    constructor(canRelease: boolean, windowLayer: WindowLayer) {
        super(canRelease, windowLayer);
        this._disable = false;
        this._tempVec = new Vec3(0, 0, 0);
        this._originYMap = new Map();
    }

    public has(accessId: string): boolean {
        if (this._map.has(accessId)) {
            const pool = this._map.get(accessId) as tools.ObjectPool<IWindowBase>;
            return pool.size() > 0;
        }
        return false;
    }

    public get(accessId: string): IWindowBase {
        if (this._map.has(accessId)) {
            const pool = this._map.get(accessId) as tools.ObjectPool<IWindowBase>;
            return pool.get();
        }
        return null;
    }

    public set(view: IWindowBase): void {
        if (!this._map.has(view.accessId)) {
            this._map.set(view.accessId, new tools.ObjectPool());
        }
    }

    public put(view: IWindowBase) {
        if (this._map.has(view.accessId)) {
            const pool = this._map.get(view.accessId) as tools.ObjectPool<IWindowBase>;;
            pool.put(view);
        }
        else {
            Assert.handle(Assert.Type.ToastManagerException, null, view.accessId);
        }
    }

    //禁用冒泡设置
    public disableBubble(disable: boolean) {
        this._disable = disable;
    }

    initView(view: IWindowBase): void {
        view.setAutoRelease(false);
    }

    addView(view: IWindowBase, ...args: any[]): void {
        Debug.log('Add toast view', view.name);
        view.open(() => {
            if (!this._disable) {
                this.bubbling(view);
            }
            this.addToToast(view);
        }, ...args);
    }

    delView(isDestroy: boolean): boolean {
        const list: IWindowBase[] = this._list as IWindowBase[];
        if (list.length > 0) {
            const view: IWindowBase = list.shift();
            view.close(isDestroy);
            return true;
        }
    }

    getView(): IWindowBase {
        const list: IWindowBase[] = this._list as IWindowBase[];
        for (let view of list) {
            if (view.hasMask) {
                return view;
            }
        }
        return null;
    }

    //冒泡显示
    private bubbling(view: IWindowBase) {
        for (let i = 0, len = this._list.length; i < len; ++i) {
            const ele = this._list[i];
            this._tempVec.set(ele.node.position);
            const ui = ele.node.getComponent(UITransform);
            const height = ui.height;
            if (height === 0) {
                Debug.warn(`Toast类型的UI "${view.accessId}" 的高为0！`);
            }
            this._tempVec.y += height;
            ele.node.setPosition(this._tempVec);
        }
    }

    private addToToast(view: IWindowBase) {
        if (this._windowLayer.addToastTip(view)) {
            if (!this._originYMap.has(view.accessId)) {
                //保存视图的Y轴坐标，用于视图Y轴坐标改变后进行重置
                this._originYMap.set(view.accessId, view.node.position.y);
            }
            else {
                //检查是否需要重置视图的Y轴坐标，因为Toast类型的视图一般会频繁存在变更Y轴的情况
                const originY = this._originYMap.get(view.accessId);
                if (originY !== view.node.position.y) {
                    view.node.setPosition(_vec3Temp.set(view.node.position.x, originY));
                }
            }
            const list: IWindowBase[] = this._list as IWindowBase[];
            list.push(view);
            if (this.canRelease) {
                this._cacheWindow.push(view);
            }
        }
    }
}