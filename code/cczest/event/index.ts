import { Button, Component, EventHandler, Node, Slider } from "cc";
import { IListener, INotify, IEventObserver } from "zest";
import { Debug } from "../Debugger";
import { CCObserver } from "./CCObserver";
import { EventListeners, CCHandler } from "./EventListeners";
import { EventObserver } from "./EventObserver";
import { CCSignal } from "./Signal";


export class EventSystem {

    private static _observer: IEventObserver = null;
    /**观察者事件系统 */
    public static get observer() {
        if (!this._observer) {
            this._observer = new EventObserver();
        }
        return this._observer;
    }

    private static _listener: EventListeners = null;
    /**普通事件监听 */
    public static get event() {
        if (!this._listener) {
            this._listener = new EventListeners();
        }
        return this._listener;
    }

    public static click(target: Node, caller: any, handler: Function) {
        target.on('click', handler, caller);
    }

    public static addClickEventHandler(target: Node, caller: any, handler: string, customData: any = "") {
        this.addEventHandler(Button, 'clickEvents', target, caller, handler, customData);
    }

    public static addSliderEventHandler(target: Node, caller: any, handler: string, customData: any = "") {
        this.addEventHandler(Slider, 'slideEvents', target, caller, handler, customData);
    }

    public static addToggleEventHandler(target: Node, caller: any, handler: string, customData: any = "") {
        this.addEventHandler(Slider, 'clickEvents', target, caller, handler, customData);
    }

    /**文本编辑按下回车键执行的回调 */
    public static addEditReturnEventHandler(target: Node, caller: any, handler: string, customData: any = "") {
        this.addEventHandler(Slider, 'editingReturn', target, caller, handler, customData);
    }

    /**结束编辑文本输入框时触发的事件回调 */
    public static addEditDidEndedEventHandler(target: Node, caller: any, handler: string, customData: any = "") {
        this.addEventHandler(Slider, 'editingDidEnded', target, caller, handler, customData);
    }

    /**编辑文本输入框时触发的事件回调 */
    public static addTextChangedEventHandler(target: Node, caller: any, handler: string, customData: any = "") {
        this.addEventHandler(Slider, 'textChanged', target, caller, handler, customData);
    }

    /**开始编辑文本输入框触发的事件回调 */
    public static addEditDidBeganEventHandler(target: Node, caller: any, handler: string, customData: any = "") {
        this.addEventHandler(Slider, 'editingDidBegan', target, caller, handler, customData);
    }

    private static addEventHandler(
        type: typeof Component,
        events: string,
        node: Node,
        component: Component,
        handler: string,
        data: any
    ): void {
        if (component instanceof Component) {
            let eventHandler: EventHandler = new EventHandler();
            let reg: RegExp = /\<(.+?)\>/g;
            let name: string;
            let result: any[] = null;

            result = reg.exec(component.name);
            result && (name = result[1]);
            eventHandler.target = component.node;
            eventHandler.component = name;
            eventHandler.handler = handler;
            eventHandler.customEventData = data;
            if (node.getComponent(type)) {
                let handlerEvents: EventHandler[] = node.getComponent(type)[events];
                let flag: boolean = false;
                for (let e of handlerEvents) {
                    if (e.handler === handler) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    handlerEvents.push(eventHandler);
                }
            }
            else {
                Debug.warn(`${component.node.name} 节点上没有 ${type.name} 组件`);
            }
        }
    }
}

export namespace EventSystem {
    export class Handler extends CCHandler {}
    export class Signal<T extends IListener, E> extends CCSignal<T, E> {}
    export abstract class GameObserver<T> extends CCObserver<T> {
        abstract update(notify: INotify<T>): void;
    }
}