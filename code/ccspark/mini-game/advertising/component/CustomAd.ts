import { Component, sys, _decorator } from "cc";
import {AdManager} from "../AdManager";

const { ccclass, property, menu, disallowMultiple } = _decorator;

@ccclass("CustomAd")
@disallowMultiple()
@menu('游戏通用组件/广告/Custom(Custom原生模板广告管理组件)')
export  class CustomAd extends Component {
    
    @property({
        tooltip: "广告位权限ID"
    })
    private adUnitId: string = '';

    @property({
        tooltip:"广告刷新时间"
    })
    private adIntervals: number = 30;

    private _adMgr: AdManager;
    private _hided: boolean;

    onLoad() {
        this._adMgr = new AdManager();
        this._hided = false;
    }

    start() {
    }

    public hide(): void {
        this._hided = true;
        this._adMgr.hideCustomAd();
    }

    public showCustomAd() {
        if (sys.Platform.WECHAT_GAME === sys.platform) {
            this._adMgr.showCustomAd(this.node, this.adUnitId, this.adIntervals, this._hided);
        }
    }

    onEnable() {
        this.showCustomAd();
    }

    onDestroy() {
        this.hide();
    }

    onDisable() {
        this.hide();
    }

    // update(dt) {

    // }
}