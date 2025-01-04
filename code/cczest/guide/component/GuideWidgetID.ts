import { Component, _decorator } from "cc";
import { GuideCameraPool } from "../GuideCameraPool";

const {ccclass, property, menu} = _decorator;

@ccclass
@menu('游戏通用组件/引导/GuideWidgetID(窗口中的UI节点ID)')
export  class GuideWidgetID extends Component {

    @property
    ID: string = '';

    @property({
        tooltip: "请确定该节点为摄像机父节点，摄像机引导过程中，只记录需要移动的摄像机的父节点",
        displayName: "是否是摄像机父节点"
    })
    isCamera: boolean = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if (this.isCamera) {
            GuideCameraPool.instance.set(this.ID, this.node);
        }
    }

    start () {

    }

    // update (dt) {}
}
