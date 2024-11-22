import { Canvas, Component, view, _decorator } from "cc";
import { GamePlatform } from "../../AppEnum";
import { CCGameWorld } from "../../CCGameWorld";
import { AdapterManager } from "../AdapterManager";

const {ccclass, property, menu, executionOrder} = _decorator;

@ccclass("AdapterHelper")
@executionOrder(-1)
@menu('游戏通用组件/适配/AdapterHelper(多分辨率屏幕适配组件)')
export  class AdapterHelper extends Component {

    @property({
        tooltip: '勾选此项，会自动选择适配方案',
        displayName: '自动适配'
    })
    autoAdapter: boolean = true;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        AdapterManager.instance.adapter(this.autoAdapter);
        this.getComponent(Canvas).alignCanvasWithScreen = true;
        this.getComponent(Canvas).alignCanvasWithScreen = false;
        if (GamePlatform.PREVIEW === CCGameWorld.getInstance().platform) {
            view.resizeWithBrowserSize(true);
        }
    }

    // update (dt) {}
}
