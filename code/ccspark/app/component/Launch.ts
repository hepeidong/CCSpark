import { Debug } from "../../Debugger";
import { Component, Prefab, _decorator } from "cc";
import { CCGameWorld } from "../CCGameWorld";
import { AdapterHelper } from "../adapter_manager/component/AdapterHelper";

const {ccclass, menu, property, executionOrder, requireComponent} = _decorator;

@ccclass("Launch")
@executionOrder(-100)
@requireComponent(AdapterHelper)
@menu('游戏通用组件/Launch(游戏初始页面组件)')
export  class Launch extends Component {

    @property({
        type: Prefab,
        tooltip: "一般是底部窗口暗透明的背景遮罩",
        displayName: "窗口底部遮罩"
    })
    private mask: Prefab = null;

    @property({
        type: Prefab,
        tooltip: "窗口加载时的加载等待界面",
        displayName: "窗口加载界面"
    })
    private wait: Prefab = null;

    @property({
        type: Prefab,
        tooltip: "挂载有触摸点击特效的预制体",
        displayName: "触摸点击特效"
    })
    private effect: Prefab = null;


    onLoad () {
        Debug.log("游戏启动完成");
        CCGameWorld.getInstance().init(this.mask, this.wait, this.effect);
    }

    onDestroy() {
        
    }

    start () {
    }

    update (dt) {
        
    }
}
