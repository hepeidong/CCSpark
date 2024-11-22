import { Component, sys, _decorator } from "cc";
import {AdManager} from "../AdManager";

const { ccclass, property, menu, disallowMultiple } = _decorator;

@ccclass("GamePortalAd")
@disallowMultiple()
@menu('游戏通用组件/广告/GamePortalAd(GamePortalAd广告管理组件)')
export  class GamePortalAd extends Component{
   
    @property({
        tooltip: "广告位权限ID"
    })
    private adUnitId: string = '';

    private _adMgr: AdManager;
  

    onLoad() {
        this._adMgr = new AdManager();
    }

    start() {
    }

    public hide(): void {
        if(this._adMgr){
            this._adMgr.hidePortalAd();
        }
    }

    public showGamePortal() {
        if (sys.Platform.WECHAT_GAME === sys.platform) {
            this._adMgr.showGamePortal(this.adUnitId);
        }
    }

    onEnable() {
        this.showGamePortal();
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