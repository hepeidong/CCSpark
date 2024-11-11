import { addGuideElement } from "../guide_utils";
import { Component, Node, _decorator } from "cc";
import { Debug } from "../../Debugger";
import { GuideManager } from "../GuideManager";
import { utils } from "../../utils";


const {ccclass, menu, 
    disallowMultiple, property, executionOrder} = _decorator;

@ccclass
@disallowMultiple
@executionOrder(100)
@menu('游戏通用组件/引导/GuidePage(引导页面组件,绑定在需要引导的窗口页面)')
export  class GuidePage extends Component {

    @property({
        type: Node,
        displayName: '引导页面节点',
        tooltip: '一般为预制体的根节点节点'
    })
    target: Node = null;

    @property({
        step: 1,
        tooltip: '当前页面的uiId',
        displayName: '视图ID'
    })
    private uiId: string = '';


    onLoad () {
        
    }

    start () {
        
    }

    onEnable() {
        this.handleGuideView();
    }

    public handleGuideView() {
        if (GuideManager.instance.hasGuideAction()) {
            this.addGuideElement();
            if (GuideManager.instance.isAgainExecute) {
                GuideManager.instance.againExecute();
            }
        }
    }

    private addGuideElement() {
        addGuideElement(this.uiId, this.target);
        this.log(this.addGuideElement, "引导节点列表", GuideManager.instance.getGuideTargets());
    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuidePage:%s]", fn.name), ...subst);
    }

    // update (dt) {}
}
