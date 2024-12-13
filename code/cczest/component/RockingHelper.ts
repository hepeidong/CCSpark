import { _decorator, Component, EventTouch, Node, UITransform, Vec2, Vec3 } from 'cc';
import { RockingBar } from './RockingBar';
import { EDITOR } from 'cc/env';
import { app } from '../app';
import { IEventBody } from '../lib.zest';
const { ccclass, property, executeInEditMode, menu } = _decorator;

const _rockingStartLocation = new Vec2();
const _originRockingVec3Temp = new Vec3();
const _vec3WPosTemp = new Vec3();

@ccclass('RockingHelper')
@executeInEditMode
@menu("游戏通用组件/虚拟摇杆/RockingHelper(摇杆助手)")
export class RockingHelper extends app.BaseLayout {

    @property(RockingBar)
    private rockingBar: RockingBar = null;

    protected onLoad(): void {
        if (!this.rockingBar) {
            let node = this.node.getChildByName("rockingBar");
            if (!node) {
                node = new Node("rockingBar");
                node.addComponent(UITransform);
                const rockingBar = node.addComponent(RockingBar);
                this.rockingBar = rockingBar;
            }
            else {
                this.rockingBar = node.getComponent(RockingBar);
            }
            this.node.addChild(node);
        }
    }

    start() {
        if (!EDITOR) {
            _originRockingVec3Temp.set(this.rockingBar.node.position.x, this.rockingBar.node.position.y);
            this.regTouch(this.node, this);
        }
    }

    private backToOrigin() {
        this.rockingBar.node.position = _originRockingVec3Temp;
    }

    onEvent(body: IEventBody) {
        switch(body.type) {
            case Node.EventType.TOUCH_START:
                this.onTouchStart(body.event as EventTouch);
                break;
            case Node.EventType.TOUCH_MOVE:
                this.onTouchMove(body.event as EventTouch);
                break;
            case Node.EventType.TOUCH_END:
                this.onTouchEnd();
                break;
            case Node.EventType.TOUCH_CANCEL:
                this.onTouchCancel();
                break;
            default:
                break;
        }
    }

    onTouchStart(event: EventTouch) {
        event.touch.getUIStartLocation(_rockingStartLocation);
        _vec3WPosTemp.set(_rockingStartLocation.x, _rockingStartLocation.y);
        this.rockingBar.node.worldPosition = _vec3WPosTemp;
        this.rockingBar.onTouchStart();
    }

    onTouchMove(event: EventTouch) {
        this.rockingBar.onTouchMove(event);
    }

    onTouchEnd() {
        this.backToOrigin();
        this.rockingBar.onTouchEnd();
    }

    onTouchCancel() {
        this.backToOrigin();
        this.rockingBar.onTouchCancel();
    }

    update(deltaTime: number) {
        
    }
}

