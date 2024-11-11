import { Component, _decorator } from "cc";
import { RedDotManager } from "../RedDotManager";


const { ccclass, property, menu } = _decorator;

@ccclass("RedDotView")
@menu('游戏通用组件/红点/RedDotView(红点显示组件)')
export  class RedDotView extends Component {

    @property({
        tooltip: '红点对应的ID'
    })
    private redDotId: string = "";

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        RedDotManager.instance.addRedDotNode(this.redDotId, this.node, this.onChange, this);
    }

    private onChange(status: boolean) {
        this.node.active = status;
    }

    start() {

    }

    // update (dt) {}
}
