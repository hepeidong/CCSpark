import { IWindowBase } from "../lib.ccspark";
import { Debug } from "../Debugger";
import { LayerManager } from "./LayerManager";
import { WindowLayer } from "./WindowLayer";

/**
 * author: HePeiDong
 * date: 2020/7/4
 * name: 顶层视图ui管理器
 * description: 顶层视图ui管理，栈存储方式。
 */
export  class TopManager extends LayerManager {
    constructor(canRelease: boolean, windowLayer: WindowLayer) {
        super(canRelease, windowLayer);
    }

    initView(view: IWindowBase): void {
        view.setAutoRelease(false);
    }

    addView(view: IWindowBase, ...args: any[]): void {
        Debug.log('Add top view', view.name);
        view.open(() => this.addToTopWindow(view), ...args);
    }

    delView(isDestroy: boolean): boolean {
        const list: IWindowBase[] = this._list as IWindowBase[];
        if (list.length > 0) {
            const view: IWindowBase = list.pop();
            view.close(isDestroy);
            return true;
        }
        return false;
    }

    getView() {
        const list: IWindowBase[] = this._list as IWindowBase[];
        for (let i: number = list.length - 1; i >= 0; --i) {
            if (list[i].hasMask) {
                return list[i];
            }
        }
        return null;
    }

    /**
     * 增加到顶层窗口
     * @param view 视图结点
     */
     private addToTopWindow(view: IWindowBase): void {
        if (this._windowLayer.addTopWindow(view, view.hasMask)) {
            const list: IWindowBase[] = this._list as IWindowBase[];
            list.push(view);
        }
    }
}