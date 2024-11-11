/*******************************************************小游戏类型定义********************************************/
/**小游戏权限类型定义 */
type Scope = {
    userInfo: string;
    userLocation: string;
    userLocationBackground: string;
    address: string;
    invoiceTitle: string;
    invoice: string;
    werun: string;
    record: string;
    writePhotosAlbum: string;
    camera: string;
}
type AuthSetting = {
    "scope.userInfo": boolean | undefined | null,// 请用button获取该信息
    "scope.userLocation": boolean | undefined | null,
    "scope.userLocationBackground": boolean | undefined | null,
    "scope.address": boolean | undefined | null,
    "scope.invoiceTitle": boolean | undefined | null,
    "scope.invoice": boolean | undefined | null,
    "scope.werun": boolean | undefined | null,
    "scope.record": boolean | undefined | null,
    "scope.writePhotosAlbum": boolean | undefined | null,
    "scope.camera": boolean | undefined | null,
}
interface LoadSubpackageTask {
    onProgressUpdate(callback: (res: {progress: number; totalBytesWritten: number; totalBytesExpectedToWrite: number}) => void);
}
interface BannerAdInterface {
    style: { left: number, top: number, realWidth: number, realHeight: number };
    show(): Promise<any>;
    destroy(): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: () => void): void;
    hide(): void;
    onResize(callback: (res: { width: number, height: number }) => void): void;
    offResice(callback: Function): void;
    offLoad(callback: Function): void;
    offError(callback: Function): void;
}
interface VideoAdInterface {
    show(): Promise<any>;
    load(): Promise<any>;
    destroy(): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: Function): void;
    onClose(callback: Function): void;
    hide(): void;
    offLoad(callback: Function): void;
    offClose(callback: Function): void;
    offError(callback: Function): void;
}
interface InterstitialAdInterface {
    show(): Promise<any>;
    load(): Promise<any>;
    destroy(): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: Function): void;
    onClose(callback: Function): void;
    hide(): void;
    offLoad(callback: Function): void;
    offClose(callback: Function): void;
    offError(callback: Function): void;
}
interface CustomAdInterface {
    style: { top: number, left: number, fixed: boolean };
    show(): Promise<any>;
    isShow(): boolean;
    destroy(): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: Function): void;
    onClose(callback: Function);
    onHide(callback: Function);
    hide(): void;
    offLoad(callback: Function): void;
    offClose(callback: Function): void;
    offError(callback: Function): void;
    offHide(callback: Function);
}
interface GridAdInterface {
    style: { left: number, top: number, width: number, height: number, realWidth: number, realHeight: number };
    adTheme: 'white'|'black';
    gridCount: 5|8;
    show(): Promise<any>;
    destroy(): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: () => void): void;
    hide(): void;
    onResize(callback: (res: { width: number, height: number }) => void): void;
    offResice(callback: Function): void;
    offLoad(callback: Function): void;
    offError(callback: Function): void;
}
interface GamePortalInterface {
    show(): Promise<any>;
    load(): Promise<any>;
    hide(): void;
    destroy(): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: Function): void;
    onClose(callback: Function): void;
    offLoad(callback: Function): void;
    offClose(callback: Function): void;
    offError(callback: Function): void;
}
interface GameIconInterface {
    hide(): void;
    show(): Promise<any>;
    load(): Promise<any>;
    destroy(): void;
    onResize(callback: (res: { width: number, height: number }) => void): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: Function): void;
    onClose(callback: Function): void;
    offResice(callback: Function): void;
    offLoad(callback: Function): void;
    offClose(callback: Function): void;
    offError(callback: Function): void;
}
interface GameBannerInterface {
    style: { left: number, top: number };
    show(): Promise<any>;
    destroy(): void;
    onError(callback: (res: { errMsg: string, errCode: number }) => void): void;
    onLoad(callback: () => void): void;
    hide(): void;
    onResize(callback: (res: { width: number, height: number }) => void): void;
    offResice(callback: Function): void;
    offLoad(callback: Function): void;
    offError(callback: Function): void;
}
interface Stylelitem {
    appNameHidden: boolean;		//游戏名称是否隐藏
    color: string;		//游戏名称的颜色色值
    size: number;		//游戏icon的宽高值
    borderWidth: number;		//游戏icon的border尺寸
    borderColor: string;		//游戏icon的border颜色色值
    left: number;		//游戏icon的X轴坐标
    top: number;		//游戏icon的Y轴坐标
}
interface ButtonStyle {
    left: number;  //左上角横坐标
    top: number;	//左上角纵坐标
    width: number;		//宽度
    height: number;		//高度
    backgroundColor?: string;		//背景颜色
    borderColor?: string;		//边框颜色
    borderWidth?: number;	//边框宽度
    borderRadius?: number;		//边框圆角
    color?: string;		//文本的颜色。格式为 6 位 16 进制数。
    textAlign?: 'left' | 'center' | 'right';		//文本的水平居中方式
    fontSize?: number;		//字号
    lineHeight?: number;		//文本的行高
}
interface UserInfo {
    nickName: string;
    /**头像 */
    avatarUrl: string;
    /**性别0 未知  1 男性 2 女性 */
    gender: number;
    /**国家 */
    country: string;
    /**省份 */
    province: string;
    /**语言 */
    language: 'en' | 'zh_CN' | 'zh_TW';
}
interface UserButtonRes {
    errMsg: string;
    userInfo: UserInfo;
    rawData: string;
    signature: string;
    encryptedData: string;
    iv: string;
}
interface ButtonInterface {
    show(): void;
    hide(): void;
    destroy(): void;
    onTap(callback: (res: UserButtonRes) => void): void;
    offTap(callback: Function): void;
}
interface RequestTask {
    abort(): void;
    onHeadersReceived(callback: (res: any) => void): void;
    offHeadersReceived(callback: Function): void;
}

declare namespace canvas {
    export function toTempFilePathSync(obj: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        destWidth?: number;
        destHeight?: number;
        fileType?: string;
        quality?: number;
    });
}

interface IMiniObject {
    success? (res: any): void;
    fail? (res: any): void;
    complete? (res: any): void;
}
interface ITTSubpackage extends IMiniObject {
    name: string;
}
interface ITTNavigateToMiniProgram extends IMiniObject {
    appId: string; 
    path?: string; 
    extraData?: any; 
    envVersion?: 'develop' | 'trial' | 'release';
}
interface ITTJoinVoIPChat extends IMiniObject {
    roomType?: 'voice' | 'video';
    nonceStr: string;
    signature: string;
    timeStamp: number;
    groupId: string;
    muteConfig?: { muteMicrophone?: boolean; muteEarphone?: boolean };
}
interface ITTAuthorize extends IMiniObject {
    scope: string;
}
interface ITTShowToast extends IMiniObject {
    title: string;
    image?: string;
    duration?: number; 
    icon?: 'success' | 'error' | 'loading' | 'none'; 
    mask?: boolean;
}
interface ITTShowLoading extends IMiniObject {
    title: string; 
    mask?: boolean;
}
interface ITTShareAppMessage extends IMiniObject {
    title: string; 
    query?: string; 
    imageUrlId?: string; 
    imageUrl?: string;
}
interface IMiniSocketSend extends IMiniObject {
    data: string|ArrayBuffer;
}
interface IMiniSocketClose extends IMiniObject {
    code: number;
    reason: string;
}