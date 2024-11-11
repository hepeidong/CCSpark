import { Node, Size, Vec2 } from "cc";
import { app } from "../../app";
import { Debug } from "../../Debugger";
import { SAFE_CALLBACK } from "../../Define";
import { utils } from "../../utils";

const errMsg = {
    1000: '后端接口调用失败',
    1001: '参数错误',
    1002: '广告单元无效',
    1003: '内部错误',
    1004: '无合适的广告',
    1005: '广告组件审核中',
    1006: '广告组件被驳回',
    1007: '广告组件被封禁',
    1008: '广告单元已关闭'
}

const videoErrMsg = {
    1000: '后端错误调用失败：该项错误不是开发者的异常情况',
    1001: '参数错误：使用方法错误',
    1002: '广告单元无效：可能是拼写错误、或者误用了其他APP的广告ID',
    1003: '内部错误：该项错误不是开发者的异常情况',
    1004: '无适合的广告：广告不是每一次都会出现，这次没有出现可能是由于该用户不适合浏览广告',
    1005: '广告组件审核中：你的广告正在被审核，无法展现广告',
    1006: '广告组件被驳回：你的广告审核失败，无法展现广告',
    1007: '广告组件被驳回：你的广告能力已经被封禁，封禁期间无法展现广告',
    1008: '广告单元已关闭：该广告位的广告能力已经被关闭'
}

const customErrMsg = {
    1000: '后端接口调用失败',
    1001: '参数错误',
    1002: '广告单元无效',
    1003: '内部错误',
    1004: '无合适的广告',
    1005: '广告组件审核中',
    1006: '广告组件被驳回',
    1007: '广告组件被封禁',
    1008: '广告单元已关闭',
    2001: '模板渲染错误',
    2002: '模板为空',
    2003: '模板解析失败',
    2004: '触发频率限制',
    2005: '触发频率限制'
}

const gamebannerErrMsg = {
    1000: '内部错误',
    1001: '参数错误',
    1002: '无效的推荐位，请检查推荐id是否正确',
    1004: '无合适的推荐',
    1008: '推荐单元已关闭',
}

class AdObj implements InterstitialAdInterface, VideoAdInterface, CustomAdInterface, GridAdInterface {
    constructor() { }
    adTheme: 'white'|'black';
    gridCount: 5|8;
    style: any = {};
    show(): Promise<any> {
        return new Promise((resolve: Function, reject: Function) => {
            reject('不是微信小游戏平台, 没有广告');
        })
    }
    isShow(): boolean { return false; }
    load(): Promise<any> {
        return new Promise((resolve: Function, reject: Function) => {
            reject('不是微信小游戏平台, 没有广告');
        })
    }
    destroy(): void { }
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void { }
    onLoad(callback: Function): void { }
    onClose(callback: Function) { }
    hide(): void { }
    offLoad(callback: Function): void { }
    offClose(callback: Function): void { }
    offError(callback: Function): void { }
    onResize(callback: (res: { width: number, height: number }) => void): void { }
    offResice(callback: Function): void { }
    onHide(callback: Function) { }
    offHide(callback: Function) { }
}

class AdAdapter {
    private static _instance: AdAdapter = null;
    constructor() {
        AdAdapter._instance = this;
    }

    public static get instance(): AdAdapter { return this._instance; }

    public createInterstitialAd(obj: { adUnitId: string }): InterstitialAdInterface { return new AdObj(); }
    public createRewardedVideoAd(obj: { adUnitId: string }): VideoAdInterface { return new AdObj(); }
    public createBannerAd(obj: { adUnitId: string, adIntervals?: number, style: { left: number, top: number, width: number, height?: number } }): any { return new AdObj(); }
    public getSystemInfoSync(): any { return {}; }
    public createCustomAd(obj: { adUnitId: string, adIntervals?: number, style: { left: number, top: number, fixed: boolean } }): CustomAdInterface { return new AdObj(); }
    public createGameBanner(obj: { adUnitId: string, style: { left: number; top: number } }): GameBannerInterface { return new AdObj(); }
    public createGamePortal(obj: { adUnitId: string }): GamePortalInterface { return new AdObj(); }
    public createGridAd(obj: { 
        adUnitId: string, 
        adIntervals?: number, 
        style: { left: number, top: number, width: number, height?: number },
        adTheme: 'white'|'black',
        gridCount: 5|8 }): GridAdInterface { return new AdObj()}
}

class WXAd extends AdAdapter {
    constructor() {
        super();
    }

    public createInterstitialAd(obj: { adUnitId: string }): InterstitialAdInterface {
        return wx.createInterstitialAd(obj);
    }
    public createRewardedVideoAd(obj: { adUnitId: string }): VideoAdInterface {
        return wx.createRewardedVideoAd(obj);
    }
    public createBannerAd(obj: { adUnitId: string, adIntervals?: number, style: { left: number, top: number, width: number, height?: number } }): any {
        return wx.createBannerAd(obj);
    }
    public getSystemInfoSync(): any { return wx.getSystemInfoSync(); }
    public createCustomAd(obj: { adUnitId: string, adIntervals?: number, style: { left: number, top: number, fixed: boolean } }): CustomAdInterface {
        return wx.createCustomAd(obj);
    }
    public createGameBanner(obj: { adUnitId: string, style: { left: number; top: number } }): GameBannerInterface {
        return wx.createGameBanner(obj);
    }
    public createGamePortal(obj: { adUnitId: string }): GamePortalInterface {
        return wx.createGamePortal(obj);
    }
    public createGridAd(obj: { 
        adUnitId: string, 
        adIntervals?: number, 
        style: { left: number, top: number, width: number, height?: number },
        adTheme: 'white'|'black',
        gridCount: 5|8 }): GridAdInterface {
            return wx.createGridAd(obj);
        }
}

class TTAd extends AdAdapter {
    constructor() {
        super();
    }

    public createRewardedVideoAd(obj: {adUnitId: string}): VideoAdInterface {
        return tt.createRewardedVideoAd(obj);
    }

    public createBannerAd(obj: { adUnitId: string, adIntervals?: number, style: { left: number, top: number, width: number, height?: number } }): any { 
        return tt.createBannerAd(obj) ;
    }

    public createInterstitialAd(obj: { adUnitId: string }): InterstitialAdInterface { 
        return tt.createInterstitialAd(obj);
    }
}

export class AdManager {
    private _top: boolean;
    private _down: boolean;
    private _left: boolean;
    private _right: boolean;
    private _center: boolean;
    private _bannerAd: BannerAdInterface;
    private _videoAd: VideoAdInterface;
    private _interstitialAd: InterstitialAdInterface;
    private _customAd: CustomAdInterface;
    private _gridAd: GridAdInterface;
    private _gameBanner: GameBannerInterface;
    private _portalAd: GamePortalInterface;
    private _okfn: Function;
    private _endfn: Function;
    private _failfn: Function;
    private _customvis: boolean;

    private static bannerAdInterval: number = 30;
    private static customAdInterval: number = 30;

    private _adAdapter: AdAdapter;
    private _adAdapterList: {};

    constructor() {
        this._bannerAd = null;
        this._adAdapterList = {};
        this._adAdapterList[app.Platform.WECHAT] = WXAd;
        this._adAdapterList[app.Platform.BYTE] = TTAd;

        const AdClass: any = this._adAdapterList[app.game.platform];
        if (AdClass) {
            this._adAdapter = new AdClass();
        }
        else {
            this._adAdapter = new AdAdapter();
        }
    }

    public static setBannerAdInterval(interval: number) {
        this.bannerAdInterval = interval;
    }

    public static setCustomAdInterval(interval: number) {
        this.customAdInterval = interval;
    }

    public showBannerAd(obj: { top: boolean; down: boolean; left: boolean; right: boolean; center: boolean; width: number; adUnitId: string }): BannerAdInterface {
        if (!this._bannerAd) {
            this.createBannerAd(obj);
        }
        this._bannerAd.show().then(() => {
            Debug.log('BannerAd 广告显示成功');
        }).catch(() => {
            this._bannerAd.show().catch((e: any) => {
                Debug.error('BannerAd 广告显示失败', e);
            })
        });
        return this._bannerAd;
    }

    public showGridAd(target: Node, adUnitId: string, adTheme: 'white'|'black', gridCount: 5|8) {
        if (!this._gridAd) {
            let position: Vec2 = utils.EngineUtil.convertToWechatSpace(target);
            let size: Size = utils.EngineUtil.convertToWechatSize(target);
            this.createGridAd(target, {
                adUnitId,
                adTheme,
                gridCount,
                style: {
                    top: position.y,
                    left: position.x,
                    width: size.width,
                    height: size.height
                }
            });
        }
        this._gridAd.show().then(() => {
            Debug.log('GridAd 广告显示成功');
        }).catch(() => {
            this._gridAd.show().then(() => {
                Debug.log('GridAd 广告显示成功');
            }).catch(err => {
                Debug.error('GridAd 广告显示失败', err);
            });
        });
        return this._gridAd;
    }

    public showVideoAd(adUnitId: string, okfn: () => void, endfn: () => void, failfn: () => void) {
        this._okfn = okfn;
        this._endfn = endfn;
        this._failfn = failfn;
        if (!this._videoAd) {
            this.createVideoAd(adUnitId);
        }
        Debug.log('视频');
        // 用户触发广告后，显示激励视频广告
        this._videoAd.show().catch(() => {
            // 失败重试
            this._videoAd.load()
                .then(() => this._videoAd.show())
                .catch(err => {
                    if (utils.DateUtil.inCD(3000, 'wx-videoAd')) return;
                    Debug.error('激励视频 广告显示失败 ', err);
                    SAFE_CALLBACK(this._failfn);
                });
        });
    }

    public showInterstitialAd(adUnitId: string) {
        if (!this._interstitialAd) {
            this.createInterstitialAd(adUnitId);
        }
        this._interstitialAd.show().catch((err) => {
            Debug.error('插屏广告显示错误', err);
        });
    }

    public showCustomAd(target: Node, adUnitId: string, adIntervals: number, hided: boolean): CustomAdInterface {
        if (!this._customAd) {
            let position = utils.EngineUtil.convertToWechatSpace(target);
            this.createCustomAd({
                adUnitId: adUnitId,
                top: position.y,
                left: position.x,
                adIntervals:adIntervals
            }, hided);
        }
        if (this._customAd) {
            this._customAd.show().catch((err) => {
                Debug.error('原生模板广告', err);
            });
        }

        return this._customAd;
    }

    /**显示推荐位 banner广告 */
    public showGameBannerAd(left: number, top: number, adUnitId: string) {
        if (!this._gameBanner) {
            this.createGameBannerAd(left, top, adUnitId);
        }
        if (this._gameBanner) {
            this._gameBanner.show().catch((e: any) => {
                Debug.error(' 推荐位 BnnerAd 广告显示失败', e);
            });
        }
    }

    /**推荐位浮层样式 显示 */
    public showGamePortal(adUnitId: string) {
        if (!this._portalAd) {
            this.createGamePortal(adUnitId);
        }
        if (this._portalAd) {
            this._portalAd.load().then(() => {
                this._portalAd.show();
            }).catch((err) => {
                console.log("浮层样式 显示失败 err", err);
            })
        }
    }

    public isShowCustomAd() {
        if (this._customAd) {
            return this._customAd.isShow();
        }
        return false;
    }

    public hideCustomAd() {
        Debug.log("createCustomAd hideCustomAd", this._customAd);
        if (this._customAd) {
            this._customAd.hide();
        }
    }

    public hideBannerAd() {
        if (this._bannerAd) {
            this._bannerAd.hide();
        }
    }

    public hideInterstitialAd() {
        if (this._interstitialAd) {
            this._interstitialAd.hide();
        }
    }

    public hideGridAd() {
        if (this._gridAd) {
            this._gridAd.hide();
        }
    }

    /**隐藏 推荐位 banner 广告 */
    public hideGameBannerAd() {
        if (this._gameBanner) {
            this._gameBanner.hide();
        }
    }

    public hidePortalAd() {
        if (this._portalAd) {
            this._portalAd.hide();
        }
    }

    private createInterstitialAd(adUnitId: string) {
        this._interstitialAd = this._adAdapter.createInterstitialAd({
            adUnitId: adUnitId
        });
        return this._interstitialAd;
    }

    private createVideoAd(adUnitId: string): VideoAdInterface {
        this._videoAd = this._adAdapter.createRewardedVideoAd({
            adUnitId: adUnitId
        });
        this._videoAd.onLoad(() => {
            Debug.log('激励视频 广告加载完成');
        });
        this._videoAd.onClose((res: any) => {
            // 用户点击了【关闭广告】按钮
            // 小于 2.1.0 的基础库版本，res 是一个 undefined
            if (res && res.isEnded || res === undefined) {
                Debug.log('激励视频 广告播放结束');
                this._endfn = null;
                SAFE_CALLBACK(this._okfn);
                this._okfn = null;
            }
            else {
                Debug.log('激励视频 广告播放中途退出');
                this._okfn = null;
                SAFE_CALLBACK(this._endfn);
                this._endfn = null;
            }
        });
        this._videoAd.onError((res: any) => {
            if (videoErrMsg[res.errCode]) {
                if (utils.DateUtil.inCD(3000, 'wx-videoAd')) return;
                Debug.log(videoErrMsg[res.errCode]);
                SAFE_CALLBACK(this._failfn);
            }
        });
        return this._videoAd;
    }

    private showErrorModal(tip: string) {
        // wx.showToast({
        //     title: tip,
        //     duration:1000,
        // });
        // wx.showModal({
        //     title: '广告错误提示',
        //     content: tip,
        //     confirmText: "确认",
        //     success: function (res) {
        //         //点击“确认”时打开设置页面
        //         if (res.confirm) {
        //         } else {
        //         }
        //     }
        // });
    }

    private createGridAd(target: Node, obj: { adUnitId: string, adIntervals?: number, 
        style: { left: number, top: number, width: number, height?: number }, adTheme: 'white'|'black', gridCount: 5|8 }) {

        this._gridAd = this._adAdapter.createGridAd(obj);
        this._gridAd.onLoad(() => {
            Debug.log('GridAd 广告加载成功');
        });
        this._gridAd.onError((res: { errMsg: string, errCode: number }) => {
            Debug.error(errMsg[res.errCode]);
            this.showErrorModal(errMsg[res.errCode]);
        });
        return this._gridAd;
    }

    private createBannerAd(obj: { top: boolean; down: boolean; left: boolean; right: boolean; center: boolean; width: number; adUnitId: string }): BannerAdInterface {
        this._top = obj.top;
        this._right = obj.right;
        this._left = obj.left;
        this._down = obj.down;
        this._center = obj.center;
        this._bannerAd = this._adAdapter.createBannerAd({
            adUnitId: obj.adUnitId,
            adIntervals: AdManager.bannerAdInterval,
            style: {
                left: 0,
                top: 0,
                width: obj.width
            }
        });
        this._bannerAd.onError((res: { errMsg: string, errCode: number }) => {
            Debug.error(errMsg[res.errCode]);
            this.showErrorModal(errMsg[res.errCode]);
        });
        this._bannerAd.onLoad(() => {
            Debug.log('BannerAd 广告加载成功');
        });
        this._bannerAd.onResize((res: { width: number, height: number }) => {
            const { windowWidth, windowHeight } = this._adAdapter.getSystemInfoSync();
            Debug.log('BannerAd 广告的宽和高', res.width, res.height);
            Debug.log('屏幕的宽和高', windowWidth, windowHeight);
            if (this._top) {
                this._bannerAd.style.top = 0;
            }
            else if (this._down) {
                this._bannerAd.style.top = windowHeight - this._bannerAd.style.realHeight;
            }
            if (this._left) {
                this._bannerAd.style.left = 0;
            }
            else if (this._right) {
                this._bannerAd.style.left = windowWidth - this._bannerAd.style.realWidth;
            }
            else if (this._center) {
                this._bannerAd.style.left = windowWidth / 2 - this._bannerAd.style.realWidth / 2;
            }
        });
        return this._bannerAd;
    }

    /**创建原生模板广告 */
    private createCustomAd(obj: { left: number; top: number; adUnitId: string; adIntervals: number }, hided: boolean): CustomAdInterface {
        this._customAd = this._adAdapter.createCustomAd({
            adUnitId: obj.adUnitId,
            adIntervals: AdManager.customAdInterval,
            style: {
                top: obj.top,
                left: obj.left,
                fixed: true
            }
        });

        this._customAd.onLoad(() => {
            Debug.log("createCustomAd 广告加载成功", this._customvis);
            if (hided) {
                this.hideCustomAd();
            }
        })
        this._customAd.onError((res: { errMsg: string, errCode: number }) => {
            Debug.error("createCustomAd 广告加载失败", customErrMsg[res.errCode]);
            this.showErrorModal(customErrMsg[res.errCode]);
        });
        return this._customAd;
    }

    /**创建推荐位banner 管理 */
    public createGameBannerAd(left: number, top: number, adUnitId: string) {
        console.log("推荐位banner 管理");

        if (!this._gameBanner) {
            console.log("banner 推荐创建gamebanner");
            this._gameBanner = this._adAdapter.createGameBanner({
                adUnitId: adUnitId,
                style: {
                    left: left,
                    top: top,
                }
            });

            this._gameBanner.onLoad(() => {
                console.log("推荐位banner 创建成功");

            });
            this._gameBanner.onError((res: { errMsg: string, errCode: number }) => {
                this.showErrorModal(gamebannerErrMsg[res.errCode]);
            });
            this._gameBanner.onResize((res: { width: number, height: number }) => {
                const { windowWidth, windowHeight } = this._adAdapter.getSystemInfoSync();
                if (this._top) {
                    this._gameBanner.style.top = 0;
                }
                else if (this._down) {
                    this._gameBanner.style.top = windowHeight;
                }
                if (this._left) {
                    this._gameBanner.style.left = 0;
                }
                else if (this._right) {
                    this._gameBanner.style.left = windowWidth;
                }
                else if (this._center) {
                    this._gameBanner.style.left = windowWidth / 2;
                }
            });
        }
    }
    
    /**推荐位浮层样式 创建 */
    private createGamePortal(adUnitId: string) {
        // return;
        const { SDKVersion } = this._adAdapter.getSystemInfoSync();
        let result2: boolean = utils.StringUtil.compareVersion(SDKVersion, '2.7.5');
        if (!result2) {
            console.log(" SDKVersion 推荐位浮层样式过低");
            return;
        }
        if (!this._portalAd) {
            this._portalAd = this._adAdapter.createGamePortal({
                adUnitId,
            });
            this._portalAd.onLoad(() => {
                console.log("推荐位管理浮层样式加载成功");
            })
            this._portalAd.onError((res: { errMsg: string, errCode: number }) => {
                console.log("推荐位管理浮层样式加载失败", res);
                this.showErrorModal(gamebannerErrMsg[res.errCode]);
            })
        }
    }
}
