/************************************微信小游戏定义*******************************************/
declare class wx {}
/**
 * 微信小游戏接口命名空间
 */
declare namespace wx {
    export const scope: Scope;
    export const authSetting: AuthSetting;
    export function loadSubpackage(obj: {name: string; success: Function; fail: Function; complete: Function;}): LoadSubpackageTask;
    export function connectSocket(obj: any): any;
    export function request(obj: any): any;
    export function exitMiniProgram(obj: { success?: Function; fail?: Function; complete?: Function });
    export function request(obj: any): RequestTask;
    export function navigateToMiniProgram(obj: { appId: string; path?: string; extraData?: any; envVersion?: 'develop' | 'trial' | 'release'; success?: (res: any) => void; fail?: Function; complete?: Function }): void;
    export function joinVoIPChat(obj: {
        roomType?: 'voice' | 'video';
        nonceStr: string;
        signature: string;
        timeStamp: number;
        groupId: string;
        muteConfig?: { muteMicrophone?: boolean; muteEarphone?: boolean };
        success?: (res: any) => void; fail?: Function; complete?: Function
    }): void;
    export function exitVoIPChat(obj: { success?: Function; fail?: Function; complete?: Function }): void;
    export function getSetting(obj: { success?: (res: any) => void; fail?: Function; complete?: Function }): void;
    export function openSetting(obj: { success?: (res: any) => void; fail?: Function; complete?: Function }): void;

    /**
     * 微信权限设置，建议使用封装好的 setAuthorize 方法，权限类型调用wx.scope
     * @param obj 
     */
    export function authorize(obj: { scope: string, success?: () => void; fail?: Function; complete?: Function }): void;
    export function createRewardedVideoAd(obj: { adUnitId: string }): VideoAdInterface;
    export function showToast(obj: { title: string, image?: string, duration?: number, icon?: 'success' | 'error' | 'loading' | 'none', mask?: boolean, success?: Function, fail?: Function, complete?: Function }): void;
    export function hideToast(): void;
    export function showLoading(obj: { title: string; mask?: boolean; success?: Function; fail?: Function; complete?: Function }): void;
    export function hideLoading(): void;
    export function createInterstitialAd(obj: { adUnitId: string }): InterstitialAdInterface;
    export function shareAppMessage(obj: { title: string, query?: string, imageUrlId?: string, imageUrl?: string, success?: (ret: any) => void | null, fail?: () => void | null }): void;
    export function onShow(callback: (ret: any) => void): void;
    export function openCustomerServiceConversation(): void;
    export function getSystemInfoSync(): any;
    export function createBannerAd(obj: { adUnitId: string, adIntervals?: number, style: { left: number, top: number, width: number, height?: number } }): BannerAdInterface;
    export function createCustomAd(obj: { adUnitId: string, adIntervals?: number, style: { left: number, top: number, fixed: boolean } }): CustomAdInterface;
    export function createGridAd(obj: { 
        adUnitId: string, 
        adIntervals?: number, 
        style: { left: number, top: number, width: number, height?: number },
        adTheme: 'white'|'black',
        gridCount: 5|8 }): GridAdInterface;
    export function getLaunchOptionsSync(): any;
    export function onAudioInterruptionBegin(callback: Function): void;
    export function onAudioInterruptionEnd(callback: Function): void;
    export function setKeepScreenOn(obj: { keepScreenOn: boolean; success?: Function; fail?: Function, complete?: Function }): void;
    export function showShareMenu(obj: { withShareTicket?: boolean; menus?: string[]; success?: Function; fail?: Function; complete?: Function }): void;
    export function onShareAppMessage(callback: () => { title?: string; imageUrl?: string; query?: string; imageUrlId?: string }): void;
    export function updateShareMenu(obj: {
        withShareTicket?: boolean; isUpdatableMessage?: boolean; activityId?: string; toDoActivityId?: string;
        templateInfo?: { parameterList: Array<{ name: string; value: string }> }; success?: Function; fail?: Function; complete?: Function
    });
    export function showModal(obj: { title: string; content: string; showCancel?: boolean; confirmText?: string; cancelText?: string; success?: (res: { confirm: boolean; cancel: boolean }) => void }): void;
    export function getOpenDataContext(): { postMessage: (message: any) => void };
    export function onShareMessageToFriend(callback: (res: { success: boolean; errMsg: string }) => void): void;
    export function setMessageToFriendQuery(obj: { shareMessageToFriendScene: number }): boolean;
    export function getUpdateManager(): {
        onCheckForUpdate: Function;
        onUpdateReady: Function;
        onUpdateFailed: Function;
        applyUpdate: Function
    };
    export function getUserInteractiveStorage(iv: string, obj: { keyList: string[]; success?: (res: Array<{ key: string; value: string }>) => void }): void;
    export function setUserCloudStorage(obj: { KVDataList: Array<{ key: string; value: string }>, success?: Function, fail?: Function }): void;
    export function checkGPS(msg: string): void;
    export function login(obj: { timeout?: number; success?: (res: any) => void; fail?: Function; complete?: Function }): void;
    /**
     * 设置微信权限，权限类型调用wx.scope
     * @param  scope       权限名称
     * @param  success     申请成功回调
     * @param  fail        申请失败回调
     * @param  denyBack    拒绝后的回调
     * @param  deniedFun   之前申请过，但被用户拒绝，这种情况的回调，此回调存在，则不弹出二次授权提示
     */
    export function setAuthorize(scope: string, success: Function, fail: Function, denyBack: Function, deniedFun: Function): void;
    /**
     * 获取位置信息，建议使用经过封装的 getMiniGameLocation
     * @param obj 
     */
    export function getLocation(obj: { type: string, success: (res: any) => void, fail?: Function, complete?: Function }): void;
    /**
     * 
     * @param onComplete 
     * latitude: 纬度
     * longitude: 经度
     * errCode: 0（可以正常获得位置信息），1（系统gps未开启），2（微信位置权限未开启）
     */
    export function getMiniGameLocation(onComplete: (res: {
        latitude: string;
        longitude: string;
        errCode: number
    }) => void): void;
    export function checkSession(obj: { success?: Function; fail?: Function; complete?: Function }): void;
    export function checkIsUserAdvisedToRest(obj: { todayPlayedTime: number, success?: (res: boolean) => void; fail?: Function; complete?: Function }): void;
    export function createFeedbackButton(obj: { type: 'text' | 'image'; text?: string; image?: string; style: ButtonStyle }): ButtonInterface;
    export function createOpenSettingButton(obj: { type: 'text' | 'image'; text?: string; image?: string; style: ButtonStyle }): ButtonInterface;
    export function createGameClubButton(obj: { type: 'text' | 'image'; text?: string; image?: string; style: ButtonStyle; icon: 'green' | 'white' | 'dark' | 'light'; }): ButtonInterface;
    export function createUserInfoButton(obj: { type: 'text' | 'image'; text?: string; image?: string; style: ButtonStyle; withCredentials: boolean; lang: 'en' | 'zh_CN' | 'zh_TW' }): ButtonInterface;
    export function createGamePortal(obj: { adUnitId: string }): GamePortalInterface;
    export function createGameIcon(obj: { adUnitId: string; count: number; style: Stylelitem[] }, stylelitem: any): GameIconInterface;
    export function createGameBanner(obj: { adUnitId: string, style: { left: number; top: number } }): GameBannerInterface;
    export function setClipboardData(obj: { data: string; success?: (res: boolean) => void; fail?: Function; complete?: Function }): void;
    export function getClipboardData(obj: { success?: (res: boolean) => void; fail?: Function; complete?: Function }): void;
    export function onNetworkStatusChange(callback: (res: any) => void): void;
    export function offNetworkStatusChange(callback: (res: any) => void): void;
    export function getNetworkType(obj: { success?: Function; fail?: Function; complete?: Function }): void;
    export function requestSubscribeMessage(obj: { tmplIds: any; success?: Function; fail?: Function; complete?: Function }): void;
    export function reportUserBehaviorBranchAnalytics(obj: {branchId: string; branchDim?: string; eventType: number }):void;
    export function aldSendEvent(send_name: string, obj: { send_key?: string; send_value?: string }): void;

    export class WXSocket {
        send(obj: IMiniSocketSend): void;
        close(obj: IMiniSocketClose): void;
        onOpen(callback: (res: any) => void): void;
        onClose(callback: (res: IMiniSocketClose) => void): void;
        onError(callback: (res: {errMsg: string}) => void): void;
        onMessage(callback: (res: {data: any}) => void): void;
    }
}
/*******************************************************************************************************/