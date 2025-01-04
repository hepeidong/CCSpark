import { Node } from "cc";
import { EventSystem } from "../event";
import { IRedDotChange, RedDotChange } from "zest";

interface IRedDot {
    node: Node;
    status: boolean;
}

export class RedDotNode {
    private _id: string;
    private _redDot: IRedDot;
    private _parent: RedDotNode;
    private _children: RedDotNode[];
    public onChange: IRedDotChange<RedDotChange, any>;
    constructor(id: string) {
        this._id = id;
        this._redDot = {node: null, status: false};
        this._parent = null;
        this._children = [];
    }

    public get id() { return this._id; }
    public get redDot() { return this._redDot; }
    public get parent() { return this._parent; }
    public set status(val: boolean) {
        this.redDot.status = val;
        const parentOnChange: IRedDotChange<RedDotChange, any> = this.onChange;
        if (parentOnChange && parentOnChange.active) parentOnChange.dispatch(val);
    }
    public get status() { return this.redDot.status; }
    public set node(val: Node) {
        this.redDot.node = val;
    }
    public get node() { return this.redDot.node; }

    public setContext(context: any) {
        this.onChange = new EventSystem.Signal(context);
    }

    public addChild(redDot: RedDotNode) {
        this._children.push(redDot);
        redDot._parent = this;
    }

    public getChildById(redDotId: string) {
        for (let e of this._children) {
            if (e.id === redDotId) {
                return e;
            }
        }
        return null;
    }

    public containChild(childId: string) {
        for (let e of this._children) {
            if (childId === e.id) {
                return true;
            }
        }
        return false;
    }

    public statusIsTrue() {
        for (let e of this._children) {
            if (e.redDot.status) {
                return true;
            }
        }
        return false;
    }
}