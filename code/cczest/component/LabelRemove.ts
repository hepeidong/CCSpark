import { Component, _decorator } from "cc";


const {ccclass, executeInEditMode} = _decorator;

@ccclass("LabelRemove")
@executeInEditMode
export  class LabelRemove extends Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    update (dt) {
        if (!this.node.parent.getComponent('BitmapLabel') && this.node.children.length > 0) {
            this.node.removeAllChildren();
            this.node.destroy();
        }
    }
}
