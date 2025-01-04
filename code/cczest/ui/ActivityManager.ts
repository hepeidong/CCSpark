import { Debug } from "../Debugger";
import { cc_zest_win_activity, IActivityManager, IWindowBase } from "zest";
import { tools } from "../tools";
import { DialoglManager } from "./DialoglManager";
import { WindowLayer } from "./WindowLayer";


/**
 * author: HePeiDong
 * 
 * date: 2020/7/4
 * 
 * name: 活动ui管理器
 * 
 * description: 管理进入游戏中弹出的各种活动ui，采用优先级管理，优先级越高，越早弹出，优先队列存储方式。
 */
export  class ActivityManager extends DialoglManager implements IActivityManager {
    //从大到小排列，优先级小的在后面弹出
    private _activityQueue: tools.PriorityQueue<cc_zest_win_activity>;
    constructor(canRelease: boolean, windowLayer: WindowLayer) {
        super(canRelease, windowLayer);
        //优先队列缓存活动页面，优先级越大，存储越靠前，就越早弹出
        this._activityQueue = new tools.PriorityQueue(
            (a: {priority: number, view: IWindowBase}, b: {priority: number, view: IWindowBase}) =>  a.priority > b.priority
        );
    }

    public setPriority(priority: number, view: IWindowBase) {
        this._activityQueue.push({priority, view});
    }

    public popActivity() {
        return this._activityQueue.pop();
    }

    addView(view: IWindowBase, ...args: any[]): void {
        Debug.log('Add activity view', view.name);
        view.open(() => this.addToCenterWindow(view), ...args);
    }

    delView(isDestroy: boolean): boolean {
        const list: IWindowBase[] = this._list as IWindowBase[];
        if (list.length > 0) {
            const view: IWindowBase = list.shift();
            view.close(isDestroy);
            return true;
        }
    }

    getView() {
        const list: IWindowBase[] = this._list;
        for (let i: number = 0, len = list.length; i < len; ++i) {
            if (list[i].hasMask) {
                return list[i];
            }
        }
        return null;
    }
}