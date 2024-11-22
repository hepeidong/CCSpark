import { Component, sys, _decorator } from "cc";
import { Debug } from "../../../Debugger";
import {AdManager} from "../AdManager";

const { ccclass, property, menu, disallowMultiple } = _decorator;

@ccclass("GameBannerInterface")
@disallowMultiple()
@menu('游戏通用组件/广告/GameBannerInterface(GameBanner推荐Banner广告管理组件)')
export  class GameBannerInterface extends Component {

    @property({
        tooltip: '广告靠左显示'
    })
    private toLeft: number = 0 ;

    @property({
        tooltip: '广告靠上显示'
    })
    private toTop: number = 0;

    @property({
        tooltip: '广告位权限ID'
    })
    private adUnitId: string = '';

    private _adMgr: AdManager;

    @property({
        tooltip: '判断单格广告'
    })
    private grids: boolean = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this._adMgr = new AdManager();
    }

    start() {
    }

    public hide(): void {
        this._adMgr.hideGameBannerAd();
    }

    public showGameBannerAd() {
        if (sys.Platform.WECHAT_GAME === sys.platform) {
            const winSize: { windowWidth: number, windowHeight: number } = wx.getSystemInfoSync();
            if (!winSize) return;
            Debug.log("显示banner 推荐位");
            if(this.grids){
                this.toTop = winSize.windowHeight - 120;
                this.toLeft = (winSize.windowWidth - 650) / 2 + 145;
            }
           
            this._adMgr.showGameBannerAd(
               this.toLeft,
               this.toTop,
               this.adUnitId,
            );
        }
    }

    onEnable() {
        this.showGameBannerAd();
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
