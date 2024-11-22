import { Node } from "cc";
import { Component, UITransform, _decorator } from "cc";

const {ccclass } = _decorator;

@ccclass("UIPriority")
class UIPriority extends Component {

    private _ui: UITransform;

    public setPriority(priority: number) {
        if (!this._ui) {
            this._ui = this.getComponent(UITransform);
            if (!this._ui) {
                this._ui = this.node.addComponent(UITransform);
            }
        }
        this.node.setSiblingIndex(priority);
    }

    public getPriority() {
        if (!this._ui) {
            this._ui = this.getComponent(UITransform);
            if (!this._ui) {
                this._ui = this.node.addComponent(UITransform);
            }
        }
        return this.node.getSiblingIndex();
    }
}

export function setPriority(target: Node, priority: number) {
    let uiPriority = target.getComponent(UIPriority);
    if (!uiPriority) {
        uiPriority = target.addComponent(UIPriority);
    }
    uiPriority.setPriority(priority);
}

export function getPriority(target: Node) {
    let uiPriority = target.getComponent(UIPriority);
    if (!uiPriority) {
        uiPriority = target.addComponent(UIPriority);
    }
    return uiPriority.getPriority();
}