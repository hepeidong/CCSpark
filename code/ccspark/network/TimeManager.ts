
export default class TimeManager {
    private static _serverTime: number = 0; //登录时服务器时间
    private static _timeDiff: number = 0;   //时间差

    /**
     * 登录时设置服务器时间
     * @param serverTime 
     */
    public static setTime(serverTime: number) {
        this._serverTime = serverTime;
        let localTime = Date.now();
        this._timeDiff = this._serverTime - localTime;
    }

    /**
     * 根据本地时间和时间差获取当前时间
     * @returns 
     */
    public static getTime() {
        let localTime = Date.now();
        let time = Math.round(localTime + this._timeDiff);
        return time;
    }
}