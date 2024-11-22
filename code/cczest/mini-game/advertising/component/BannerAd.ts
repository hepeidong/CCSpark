import { Component, sys, view, _decorator } from "cc";
import {AdManager} from "../AdManager";

const { ccclass, property, menu, disallowMultiple } = _decorator;

@ccclass("BannerAd")
@disallowMultiple()
@menu('游戏通用组件/广告/BannerAd(Banner广告管理组件)')
export  class BannerAd extends Component {

    @property({
        tooltip: '广告靠左显示'
    })
    private toLeft: boolean = false;

    @property({
        tooltip: '广告靠右显示'
    })
    private toRight: boolean = false;

    @property({
        tooltip: '广告靠下显示'
    })
    private toDown: boolean = false;

    @property({
        tooltip: '广告靠上显示'
    })
    private toTop: boolean = false;

    @property({
        tooltip: '广告居中显示'
    })
    private toCenter: boolean = false;

    @property({
        tooltip: '广告节点的宽度'
    })
    private width: number = 0;

    @property({
        tooltip: '广告位权限ID'
    })
    private adUnitId: string = '';

    private _adMgr: AdManager;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this._adMgr = new AdManager();
    }

    start() {
    }

    public hide(): void {
        this._adMgr.hideBannerAd();
    }

    public showBannerAd() {
        if (sys.Platform.WECHAT_GAME === sys.platform) {
            const winSize: { windowWidth: number, windowHeight: number } = wx.getSystemInfoSync();
            if (!winSize) return;
            view.getDesignResolutionSize
            const w: number = this.width * winSize.windowWidth / view.getDesignResolutionSize().width;
            this._adMgr.showBannerAd({
                adUnitId: this.adUnitId,
                width: w,
                top: this.toTop,
                down: this.toDown,
                left: this.toLeft,
                right: this.toRight,
                center: this.toCenter
            });
        }
    }

    onEnable() {
        this.showBannerAd();
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
