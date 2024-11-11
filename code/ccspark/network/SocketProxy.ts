import { GameSocket } from "./GameSocket";
import { js } from "cc";
import { app } from "../app";
import { Constructor } from "../lib.ccspark";

enum Sockey_Key {
    WECHAT_SOCK = "WXSocket",
    BYTE_SOCK = "TTSocket",
    PREVIEW_SOCK = "NativeSocket",
    BROWSER_SOCK = "NativeSocket",
    ANDROID_SOCK = "NativeSocket",
    IOS_SOCK = "NativeSocket",
    WIN32_SOCK = "NativeSocket"
}

let _proxyMap: Map<number, string>;
function getProxy(key: number) {
    if (!_proxyMap) {
        _proxyMap = new Map();
        _proxyMap.set(app.Platform.WECHAT, Sockey_Key.WECHAT_SOCK);
        _proxyMap.set(app.Platform.BYTE, Sockey_Key.BYTE_SOCK);
        _proxyMap.set(app.Platform.PREVIEW, Sockey_Key.PREVIEW_SOCK);
        _proxyMap.set(app.Platform.BROWSER, Sockey_Key.BROWSER_SOCK);
        _proxyMap.set(app.Platform.ANDROID, Sockey_Key.ANDROID_SOCK);
        _proxyMap.set(app.Platform.IOS, Sockey_Key.IOS_SOCK);
        _proxyMap.set(app.Platform.WIN32, Sockey_Key.WIN32_SOCK);
    }
    return _proxyMap.get(key);
}

/**
 * author: 何沛东
 * date: 2021/7/25
 * name: 网络socket代理管理类
 * description: 负责游戏中的不同平台的socket代理的管理
 */
export class SocketProxy {
    /**网络socke代理初始化 */
    public static instantiate() {
        const className = getProxy(app.game.platform);
        let proxy = js.getClassByName(className) as Constructor<GameSocket<any>>;
        if (proxy) {
            new proxy().description();
        }   
    }
}