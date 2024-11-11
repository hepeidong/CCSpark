import { Component, UITransform, _decorator } from "cc";

const {ccclass } = _decorator;

@ccclass("UIPriority")
export class UIPriority extends Component {

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