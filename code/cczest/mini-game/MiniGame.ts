import { app } from "../app";
import { SAFE_CALLBACK } from "../Define";


/**********************************获取微信设置权限 ***********************/
const authsName = {
    "scope.userInfo": "用户信息",// 请用button获取该信息
    "scope.userLocation": "地理位置",
    "scope.userLocationBackground": "后台定位",
    "scope.address": "通讯地址",
    "scope.invoiceTitle": "发票抬头",
    "scope.invoice": "获取发票",
    "scope.werun": "微信运动步数",
    "scope.record": "麦克风",
    "scope.writePhotosAlbum": "保存到相册",
    "scope.camera": "摄像头",
}

const ScopeMap = {
    userInfo: "scope.userInfo",
    userLocation: "scope.userLocation",
    userLocationBackground: "scope.userLocationBackground",
    address: "scope.address",
    invoiceTitle: "scope.invoiceTitle",
    invoice: "scope.invoice",
    werun: "scope.werun",
    record: "scope.record",
    writePhotosAlbum: "scope.writePhotosAlbum",
    camera: "scope.camera"
}

export class MiniGameAuthorize {
    //微信功能权限申请
    private _authSetting: AuthSetting;   //权限设置信息
    private _scope: string;         //权限名称
    private _mini: typeof wx|typeof tt;
    private _success: Function;       //申请成功回调
    private _fail: Function;          //申请失败回调
    private _denyBack: Function;      //拒绝后的回调
    private _deniedFun: Function;     //之前申请过，但被用户拒绝，这种情况的回调

    constructor() {
        
    }

    private static _ins: MiniGameAuthorize = null;
    public static get instance(): MiniGameAuthorize {
        return this._ins = this._ins ? this._ins : new MiniGameAuthorize();
    }
    public get authSetting(): AuthSetting { return this._authSetting; }

    public setMiniGameModule(mini: any) {
        this._mini = mini;
        this._mini.getSetting({
            success: (ret) => {
                this._authSetting = ret.authSetting;
            }
        });
    }

    /**
     * 获取权限
     * @param  scope       权限名称
     * @param  success     申请成功回调
     * @param  fail        申请失败回调
     * @param  denyBack    拒绝后的回调
     * @param  deniedFun   之前申请过，但被用户拒绝，这种情况的回调，此回调存在，则不弹出二次授权提示
     */
    public setAuthorize(scope: string, success: Function, fail: Function, denyBack: Function, deniedFun: Function) {
        this.resetData();
        this._scope = scope;
        this._success = success;
        this._fail = fail;
        this._denyBack = denyBack;
        this._deniedFun = deniedFun;

        let that = this;
        this._mini.getSetting({
            success(ret) {
                that._authSetting = ret.authSetting;
                let authSetting = ret.authSetting;
                if (authSetting[that._scope] === undefined || authSetting[that._scope] === null) {
                    that._mini.authorize({
                        scope: scope,
                        success() {
                            SAFE_CALLBACK(that._success);
                        },
                        fail() {
                            SAFE_CALLBACK(that._denyBack);
                        }
                    });
                }
                else if (authSetting[that._scope] == false) {
                    if (that._deniedFun) {
                        if (that._deniedFun && typeof that._deniedFun === 'function') {
                            that._deniedFun();
                        }
                        return;
                    }

                    let title = '功能设置';
                    let content = '检测到您没有打开' + authsName[that._scope] + '功能，是否去设置打开？';

                    that._mini.showModal
                        ({
                            title: title,
                            content: content,
                            confirmText: "确认",
                            cancelText: "取消",
                            success: function (res: any) {
                                that.successFn(res);
                            }
                        });
                }
                else {
                    SAFE_CALLBACK(that._success);
                }
            },
            fail() {
                SAFE_CALLBACK(that._fail);
            }
        });
    }

    private successFn(res: any) {
        //点击“确认”时打开设置页面
        let that = this;
        if (res.confirm) {
            this._mini.openSetting({
                success(ret_openSet) {
                    that._authSetting = ret_openSet.authSetting;
                    SAFE_CALLBACK(that._success);
                },
                fail() {
                    SAFE_CALLBACK(that._fail);
                }
            });
        } else {
            SAFE_CALLBACK(that._fail);
        }
    }

    /**
     * 重置数据
     */
    private resetData() {
        this._scope = null;
        this._success = null;
        this._fail = null;
        this._denyBack = null;
        this._deniedFun = null;
    }
}

const errMsg = {
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

const gpsErrCodeName = {
    0: '正常获取GPS',
    1: '没有开启系统GPS',
    2: '没有打开微信地理位置权限'
}
class MiniGameGPS {
    private _isSetGPS: boolean|undefined;
    private _gpsErrCode: number//0：可以正常获得位置信息，1: 系统gps未开启，2：微信位置权限未开启
    private _mini: typeof wx|typeof tt;

    constructor() {

    }

    private static _ins: MiniGameGPS = null;
    public static get instance(): MiniGameGPS {
        return this._ins = this._ins ? this._ins : new MiniGameGPS();
    }

    public setMiniGameModule(mini: any) {
        this._mini = mini;
    }

    public getMiniGameLocation(onComplete: (res: {latitude: string; longitude: string; errCode: number, errMsg: string}) => void) {
        if (!MiniGameAuthorize.instance.authSetting["scope.userLocation"]) {
            this._gpsErrCode = 2;
            MiniGameAuthorize.instance.setAuthorize(ScopeMap.userLocation, () => {
                this.makeIsSetGPS();
                this.getLocation(onComplete);
            }, () => {
                
            }, () => {
                
            }, () => {});
        }
        else {
            if (this._gpsErrCode === 1) {
                //系统gps未开启
                SAFE_CALLBACK(onComplete, {latitude: '', longitude: '', errCode: this._gpsErrCode, errMsg: gpsErrCodeName[this._gpsErrCode]});
            }
            else {
                this.getLocation(onComplete);
            }
        }
    }

    private getLocation(callback: (res: {latitude: string; longitude: string; errCode: number, errMsg: string}) => void) {
        this._mini.getLocation({
            type: 'wgs84',
            success:(res) => {
                const latitude = res.latitude.toFixed(6);
                const longitude = res.longitude.toFixed(6);
                this._gpsErrCode = 0;
                const arg = {latitude: latitude, longitude: longitude, errCode: this._gpsErrCode, errMsg: gpsErrCodeName[this._gpsErrCode]};
                SAFE_CALLBACK(callback, arg);
            },
            fail:() => {
                //如果undefined，说明系统GPS没有开启
                if (this._isSetGPS || this._isSetGPS === undefined) {
                    this._gpsErrCode = 1;
                } else {
                    this._gpsErrCode = 2;
                }
                const arg = {latitude: '', longitude: '', errCode: this._gpsErrCode, errMsg: gpsErrCodeName[this._gpsErrCode]};
                SAFE_CALLBACK(callback, arg);
            }
        })
    }

    private makeIsSetGPS() {
        if (!MiniGameAuthorize.instance.authSetting) return;
        if (MiniGameAuthorize.instance.authSetting['scope.userLocation'] === undefined) {
            this._isSetGPS = undefined;
        }
        else {
            this._isSetGPS = MiniGameAuthorize.instance.authSetting['scope.userLocation'];
        }
    }
}

export class MiniGame {
    public static readonly scope: Scope = ScopeMap;
    public static readonly authSetting: AuthSetting = MiniGameAuthorize.instance.authSetting;
    /**
     * 初始化小游戏模块
     */
    public static initMiniGame() {
        if (app.game.platform === app.Platform.WECHAT) {
            this.initModule(wx);
        }
        else if (app.game.platform === app.Platform.BYTE) {
            this.initModule(tt);
        }
    }
    private static initModule(mini: any) {
        MiniGameAuthorize.instance.setMiniGameModule(mini);
        MiniGameGPS.instance.setMiniGameModule(mini);
        mini["setAuthorize"] = MiniGameAuthorize.instance.setAuthorize;
        mini["getMiniGameLocation"] = MiniGameGPS.instance.getMiniGameLocation;
    }
}