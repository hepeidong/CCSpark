import { Component, EventMouse, EventTouch, Node, _decorator, Input } from "cc";
import { IBaseLayout, IEventBody } from "../lib.ccspark";
import { CCGameWorld } from "./CCGameWorld";


const {ccclass} = _decorator;

@ccclass("CCBaseLayout")
export class CCBaseLayout extends Component implements IBaseLayout {

    protected  sendNotice(name: string, body: any = null, type: string = null): void {
        CCGameWorld.getInstance().sendNotice(name, body, type);
    }

    protected regTouch(node: Node, target?: any, useCapture?: boolean) {
        node.on(Input.EventType.TOUCH_START, this.onTouchEvent, target, useCapture);
        node.on(Input.EventType.TOUCH_MOVE, this.onTouchEvent, target, useCapture);
        node.on(Input.EventType.TOUCH_END, this.onTouchEvent, target, useCapture);
        node.on(Input.EventType.TOUCH_CANCEL, this.onTouchEvent, target, useCapture);
    }

    protected regMouse(node: Node, target?: any, useCapture?: boolean) {
        node.on(Input.EventType.MOUSE_DOWN, this.onMouseEvent, target, useCapture);
        node.on(Node.EventType.MOUSE_ENTER, this.onMouseEvent, target, useCapture);
        node.on(Node.EventType.MOUSE_LEAVE, this.onMouseEvent, target, useCapture);
        node.on(Input.EventType.MOUSE_MOVE, this.onMouseEvent, target, useCapture);
        node.on(Input.EventType.MOUSE_UP, this.onMouseEvent, target, useCapture);
        node.on(Input.EventType.MOUSE_WHEEL, this.onMouseEvent, target, useCapture);
    }

    protected onEvent(body: IEventBody) {}

    private onTouchEvent(event: EventTouch) {
        const body: IEventBody = {
            event,
            node: event.target,
            type: event.type
        }
        this.onEvent(body);
    }

    private onMouseEvent(event: EventMouse) {
        const body: IEventBody = {
            event,
            node: event.target,
            type: event.type
        }
        this.onEvent(body);
    }
}