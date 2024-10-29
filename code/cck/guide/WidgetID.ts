import { Component, _decorator } from "cc";

const {ccclass, property, menu} = _decorator;

@ccclass
@menu('游戏通用组件/引导/WidgetID(窗口中的UI节点ID)')
export  class WidgetID extends Component {

    @property
    ID: string = '';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
