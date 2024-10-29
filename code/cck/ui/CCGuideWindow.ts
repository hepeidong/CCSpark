import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";
import { GuideHelper } from "../guide/component/GuideHelper";
import { WindowBase } from "./WindowBase";
import { WindowManager } from "./WindowManager";
import { IGuideWindow } from "../lib.cck";
import { Component } from "cc";
import { UIType } from "./UIType";

/**
 * author: HePeiDong
 * date: 2021/2/20
 * name: 引导提示页面基类
 * description: 控制引导提示页面的相关显示,关闭,销毁,资源释放
 */
export class CCGuideWindow extends WindowBase<GuideHelper> implements IGuideWindow {

    public closeGuideWindow() {
        WindowManager.instance.delView(this.getViewType(), false);
    }

    onCreate(): UIType {
        this.isAddMask(false);
        return UIType.TOP_LAYER;
    }

    protected _loadView() {
        const components = this.node.getComponents(Component);
        for (const component of components) {
            if (component instanceof GuideHelper) {
                this.setViewComponent(component);
                return;
            }
        }
        //缺少GuideHelper组件
        Assert.handle(Assert.Type.GetComponentException, null, "GuideHelper");
    }

    protected _openView() {
        this.popupView();
    }

    protected _closeView() {
        this.removeView();
        WindowManager.instance.exitView(this);
    }
}