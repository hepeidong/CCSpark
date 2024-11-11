import { _decorator, Component, Node, EventHandler } from 'cc';
import { IntersectHelper } from './IntersectHelper';
import { Intersections } from './Intersections';
const { ccclass, property, menu } = _decorator;

@ccclass('IntersectGroup')
@menu('游戏通用组件/拖拽放置功能套件/IntersectGroup(相交检测组组件)')
export class IntersectGroup extends Intersections {

    @property({
        type: Intersections,
        tooltip: "指定需要判定是否相交的目标组合"
    })
    private targetGroup: Intersections = null;

    @property({
        type: EventHandler,
        tooltip: "相交判定后执行的事件"
    })
    intersectEvents: EventHandler[] = [];

    private _oldLength: number;
    private _lengthChange: boolean;
    private _preventJuage: boolean;
    start() {
        this._lengthChange = false;
        this._preventJuage = false;
        this.initGroup();
    }

    /**
     * 判定相交，如果目标节点有Button组件，且为禁用状态，则此方法始终返回false
     * @returns 返回是否相交，注意：如果当前帧，相交组的子节点发生了数量变化，此时该函数会返回false，在下一帧会正确发送相交判定后的事件
     */
    public juageIntersect() {
        if (!this._lengthChange) {
            if (this.targetGroup) {
                return this.checkIntersect();
            }
        }
        else {
            this._preventJuage = true;
        }
        return false;
    }

    private checkIntersect() {
        const targetGroup = this.targetGroup.group;
        for (const helper of this._group) {
            for (const target of targetGroup) {
                helper.setTarget(target.node);
                const isIntersect = helper.getIsIntersect();
                if (isIntersect) {
                    EventHandler.emitEvents(helper.intersectEvents, helper);
                    EventHandler.emitEvents(this.intersectEvents, helper);
                    return isIntersect;
                }
            }
        }
        return false;
    }

    private initGroup() {
        const children = this.node.children;
        this._oldLength = children.length;
        for (const child of children) {
            const helper = child.getComponent(IntersectHelper);
            if (helper) {
                this._group.push(helper);
            }
        }
        this._lengthChange = false;
    }

    update(deltaTime: number) {
        if (this.node.children.length != this._oldLength) {
            this._lengthChange = true;
            this.initGroup();
            if (this._preventJuage) {
                this._preventJuage = false;
                this.juageIntersect();
            }
        }
    }
}

