import { Node } from "cc";
import { IRedDotAction, RedDotChange } from "../lib.ccspark";
import { Assert } from "../exceptions/Assert";
import { RedDotNode } from "./RedDotNode";


interface IRedDotMap {
    [n: string]: RedDotNode;
}

/**
 * author: 何沛东
 * date: 2021/7/27
 * name: 红点管理类型
 * description: 负责游戏中红点的显示管理
 */
export class RedDotManager {
    private _redDotMap: IRedDotMap; 
    private _redDotActionMap: Map<string, IRedDotAction>;
    constructor() {
        this._redDotMap = {};
        this._redDotActionMap = new Map();
    }

    private static _ins: RedDotManager = null;
    public static get instance(): RedDotManager {
        return this._ins = this._ins ? this._ins : new RedDotManager();
    }

    public addRedDotNode(redDotId: string, node: Node, listener: RedDotChange, target: any) {
        if (redDotId in this._redDotMap) {
            const redDotNode = this._redDotMap[redDotId];
            redDotNode.node = node;
            redDotNode.setContext(target);
            redDotNode.onChange.add(listener);
            this.update(redDotId);
        }
        else {
            let redDotNode: RedDotNode = this.getChildById(redDotId);
            if (Assert.handle(Assert.Type.FindRedDotException, redDotNode, redDotId)) {
                redDotNode.node = node;
                redDotNode.setContext(target);
                redDotNode.onChange.add(listener);
                this.update(redDotId);
            }
        }
    }

    public setRedDot(parentId: string, childId: string) {
        if (!(parentId in this._redDotMap)) {
            //存储结构是树，此时的parentId对应的节点很可能是别的树的子节点
            const parent = this.getChildById(parentId);
            if (parent) {
                const child = this.getChildById(childId); 
                if (child) {
                    parent.addChild(child);
                }
                else {
                    this.addChild(parent, childId);
                }
            }
            else {
                let redDot: RedDotNode = new RedDotNode(parentId);
                this._redDotMap[parentId] = redDot;
                this.addChildRedDot(parentId, childId);
            }
        }
        else {
            this.addChildRedDot(parentId, childId);
        }
    }

    public setRedDotStatus(redDotId: string, status: boolean) {
        if (redDotId in this._redDotMap) {
            let redDot: RedDotNode = this._redDotMap[redDotId];
            redDot.status = status;
        }
        else {
            let child: RedDotNode = this.getChildById(redDotId);
            if (Assert.handle(Assert.Type.FindRedDotException, child, redDotId)) {
                child.status = status;
                this.resetParentStatus(child);
            }
        }
    }

    public addRedDotAction<T extends IRedDotAction>(classRef: {new (id: string): T}, redDotId: string) {
        if (!this._redDotActionMap.has(redDotId)) {
            let action = new classRef(redDotId);
            this._redDotActionMap.set(redDotId, action);
        }
    }

    public update(redDotId: string) {
        if (this._redDotActionMap.has(redDotId)) {
            let redDotLogic = this._redDotActionMap.get(redDotId);
            redDotLogic.updateStatus();
        }
    }

    private resetParentStatus(child: RedDotNode) {
        let p: RedDotNode = child.parent;
        while (p !== null && p !== undefined) {
            //设置完儿子红点的状态之后必须要要去重置父亲红点的状态
            //父亲红点的状态重置规则是, 当所有儿子红点的状态都不显示时, 父亲红点状态也不显示, 反之则显示 
            let status: boolean = p.statusIsTrue();
            p.status = status;
            p = p.parent;
        }
    }

    private getChildById(redDotId: string) {
        if (typeof redDotId === "string") {
            for (const k in this._redDotMap) {
                const parent = this._redDotMap[k];
                const child = parent.getChildById(redDotId);
                if (child !== null) {
                    return child;
                }
            }
        }
        return null;
    }

    private addChildRedDot(parentId: string, childId: string) {
        if (typeof childId === "string") {
            const parent = this._redDotMap[parentId];
            if (Assert.handle(Assert.Type.RedDotAlreadyExistsException, !parent.containChild(childId), childId)) {
                this.addChild(parent, childId);
            }
        }
    }

    private addChild(parent: RedDotNode, childId: string) {
        if (typeof childId === "string") {
            const child = new RedDotNode(childId);
            parent.addChild(child);
        }
    }
}

export const redDotManager = RedDotManager.instance;