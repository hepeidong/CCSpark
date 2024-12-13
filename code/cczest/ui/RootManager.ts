import { IWindowBase } from "../lib.zest";
import { Debug } from "../Debugger";
import { LayerManager } from "./LayerManager";
import { WindowLayer } from "./WindowLayer";

/**
 * author: HePeiDong
 * date: 2020/7/4
 * name: 根视图ui管理器
 * description: 根视图ui管理，栈储方式。
 */
export  class RootManager extends LayerManager {
    private _oldView: IWindowBase;
    private _argsList: any[][];
    constructor (canRelease: boolean, windowLayer: WindowLayer) {
        super(canRelease, windowLayer);
        this._argsList = [];
    }

    initView(view: IWindowBase): void {
        view.setAutoRelease(false);
    }

    addView(view: IWindowBase, ...args: any[]) {
        Debug.log('Add root view', view.name);
        view.open(() => {
            this._argsList.push(args);
            this.addToRootWindow(view);
        }, ...args);
    }

    delView(): boolean {
        const list: IWindowBase[] = this._list;
        if (list.length > 0){
            this._argsList.pop();
            const view = list.pop();
            view.close();
            // this.addView(list.pop(), ...this._argsList.pop());
            return true;
        }
        return false;
    }

    getView(): IWindowBase {
        return null;
    }

    /**
     * 增加到最底层的跟节点窗口
     * @param view 视图结点
     */
     private addToRootWindow(view: IWindowBase): void {
        if (this._windowLayer.addRootWindow(view)) {
            // this.rootViewPush(view);
            const list: IWindowBase[] = this._list;
            this.delView();
            list.push(view);
        }
    }

    private rootViewPush(view: IWindowBase) {
        const list: IWindowBase[] = this._list;
        if (this._oldView) {
            this._oldView.close();
        }
        this._oldView = view;
        list.push(view);
    }
}