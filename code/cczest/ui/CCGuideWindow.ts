import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";
import { GuideHelper } from "../guide/component/GuideHelper";
import { WindowBase } from "./WindowBase";
import { WindowManager } from "./WindowManager";
import { IAssetRegister, IGuideWindow } from "../lib.zest";
import { Component } from "cc";
import { UIType } from "./UIType";
import { JsonAsset } from "cc";

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

    listAssetUrls(assetRegister: IAssetRegister) {
        assetRegister.addDirPath("json");
    }

    onCreate(): UIType {
        this.isAddMask(false);
        return UIType.TOP_LAYER;
    }

    protected _loadView() {
        let flag = false;
        const components = this.node.getComponents(Component);
        for (const component of components) {
            if (component instanceof GuideHelper) {
                this.setViewComponent(component);
                flag = true;
                return;
            }
        }
        //缺少GuideHelper组件
        Assert.handle(Assert.Type.GetComponentException, flag, "GuideHelper");
    }

    protected _openView() {
        this.popupView();
    }

    protected _closeView() {
        this.removeView();
        WindowManager.instance.exitView(this);
    }

    /**
     * 获取引导数组
     * @param group 引导组数据 
     * @returns 
     * @example
     *  this.getGuideAsset(guide.group);
     */
    protected getGuideAsset(group: {}) {
        const data = {};
        for (const key in group) {
            const groupName = group[key];
            data[groupName] = this.getGameAsset(groupName, JsonAsset).json;
        }
        return data;
    }
}