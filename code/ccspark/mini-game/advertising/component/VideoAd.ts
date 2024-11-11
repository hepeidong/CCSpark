import { Component, EventHandler, _decorator } from "cc";
import { app } from "../../../app";
import { EventSystem } from "../../../event";
import { utils } from "../../../utils";
import { AdManager } from "../AdManager";

const { ccclass, property, menu, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple()
@menu('游戏通用组件/广告/VideoAd(VideoAd广告管理组件)')
export  class VideoAd extends Component {

    @property({
        tooltip: '视频广告ID',
        displayName: '微信平台广告ID',
    })
    private wxAdUnitId: string = '';

    @property({
        tooltip: '视频广告ID',
        displayName: '字节平台广告ID',
    })
    private ttAdUnitId: string = '';

    @property({
        type: Component.EventHandler,
        tooltip: '正常播放结束事件回调'
    })
    private completeEvent: EventHandler = new EventHandler();

    @property({
        type: EventHandler,
        tooltip: '中途退出事件回调'
    })
    private quitEvent: EventHandler = new EventHandler();

    @property({
        type: EventHandler,
        tooltip: '视频加载失败事件回调'
    })
    private failEvent: EventHandler = new EventHandler();

    private _canPlay: boolean = true;

    private _adMgr: AdManager;


    onLoad() {
        this._adMgr = new AdManager();
        EventSystem.click(this.node, this, this.onClicked);
    }

    start() {

    }

    public set adUnitId(val: string) {
        if (app.game.platform === app.Platform.WECHAT) {
            this.wxAdUnitId = val;
        }
    }
    public get adUnitId(): string {
        if (app.game.platform === app.Platform.BYTE) {
            return this.ttAdUnitId;
        }
        else if (app.game.platform === app.Platform.WECHAT) {
            return this.wxAdUnitId;
        }
    }

    public setVideoAdPlayStatus(canPlay: boolean) {
        this._canPlay = canPlay;
    }

    private onClicked() {
        if (utils.DateUtil.inCD(50, 'video_click')) {
            return;
        }
        if (!this._canPlay) return;
        let adUnitId: string;
        if (app.game.platform === app.Platform.WECHAT) {
            adUnitId = this.wxAdUnitId;
        }
        else if (app.game.platform === app.Platform.BYTE) {
            adUnitId = this.ttAdUnitId;
        }
        this._adMgr.showVideoAd(adUnitId,
            () => this.completeEvent.emit([this.completeEvent.handler]),
            () => this.quitEvent.emit([this.quitEvent.handler]),
            () => this.failEvent.emit([this.failEvent.handler])
        );
    }


    // update (dt) {}
}
