import { GameSocket } from "./GameSocket";
import { SocketProxy } from "./SocketProxy";
import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";
import { cc_zest_socket_message, cc_zest_socket_protocol, Constructor, ISocket_extend, IResponseSocketData, ISocketClient, ISocketChange, ISocketMessage, ISocketMessage_extend, ISocketNetworkDelay, ISocketNotConnected, ISocketProtocol, SocketChange, SocketNetworkDelay, SocketNotConnected } from "zest";
import { js } from "cc";
import { EventSystem } from "../event";
import { tools } from "../tools";
import { errMsg, SocketEnum } from "./SocketEnum";




class TimerTask  {
    private _interval: number;
    private _timeoutCount: number;
    private _callback: (timeoutCount: number) => void;
    private _timerId: string;
    constructor() {
        this._interval     = 0;
        this._timeoutCount = 0;
        this._timerId      = "";
    }

    public get interval() { return this._interval; }

    /**
     * 设置超时定时器的时间间隔
     * @param interval 
     */
    setTimeInterval(interval: number): void {
        this._interval = interval;
    }
    /**
     * 注册超时定时器
     * @param callback 
     * @param target 
     */
    regTimerTask(callback: (timeoutCount: number) => void, target: any): void {
        this._callback = callback.bind(target);
    }
    /**开启一个新的超时定时器 */
    setTimerTask(): void {
        if (this._timerId) {
            tools.Timer.clearTimeout(this._timerId);
        }
        this._timerId = tools.Timer.setTimeout(() => {
            this._callback(++this._timeoutCount);
        }, this._interval);
    }
    /**移除旧的超时定时器 */
    moveTimerTask(): void {
        tools.Timer.clearTimeout(this._timerId);
    }
}



/**
 * author: 何沛东
 * date: 2021/7/20
 * name: 网络socket连接管理类
 * description: 负责游戏中的网络连接管理
 */
export class Socket implements ISocket_extend {
    private _currentExceptionCount: number;
    private _currentLinkCount: number;
    private _linkCountMax: number;
    private _timeoutCountMax: number;
    private _msgTimestamp: number;
    private _url: string;
    private _heartbeat: ISocketMessage<any, any>;
    private _socket: ISocketClient;
    private _timeoutCheckTask: TimerTask;
    private _heartbeatTimerTask: TimerTask;
    private _socketProtocol: ISocketProtocol;
    private _sendQueue: tools.Queue<string>;
    private _msgMap: {};
    private _onConnected: ISocketChange<SocketChange, Socket>;
    private _onConnectionException: ISocketChange<SocketChange, Socket>;
    private _onConnectionRestore: ISocketChange<SocketChange, Socket>;
    private _onDisconnected: ISocketChange<SocketChange, Socket>;
    private _onNotConnected: ISocketNotConnected<SocketNotConnected, Socket>;
    private _onNetworkDelay: ISocketNetworkDelay<SocketNetworkDelay, Socket>;
    constructor() {
        this._currentExceptionCount = 0;
        this._currentLinkCount  = 0;
        this._linkCountMax      = 3;
        this._timeoutCountMax   = 2;
        this._msgTimestamp      = 0;
        this._sendQueue         = new tools.Queue(10, false);
        this._msgMap            = {};

        this._timeoutCheckTask   = new TimerTask();
        this._heartbeatTimerTask = new TimerTask();
        this._timeoutCheckTask.setTimeInterval(5);
        this._timeoutCheckTask.regTimerTask(this.onTimeoutCheck, this);
        this._heartbeatTimerTask.setTimeInterval(10);
        this._heartbeatTimerTask.regTimerTask(this.sendHeartbeat, this);
        
        this._onConnected           = new EventSystem.Signal(this);
        this._onConnectionException = new EventSystem.Signal(this);
        this._onConnectionRestore   = new EventSystem.Signal(this);
        this._onDisconnected = new EventSystem.Signal(this);
        this._onNotConnected = new EventSystem.Signal(this);
        this._onNetworkDelay = new EventSystem.Signal(this);

        SocketProxy.instantiate();
        this._socket = GameSocket.getSocket();
    }

    private static _ins: Socket = null;
    public static get instance(): Socket {
        return this._ins = this._ins ? this._ins : new Socket();
    }

    public get timeoutInterval() { return this._timeoutCheckTask.interval; }
    public get heartbeatInterval() { return this._heartbeatTimerTask.interval; }
    public get protocolType(): cc_zest_socket_protocol { return this._socket.protocolType; }
    public get onConnected(): ISocketChange<SocketChange, Socket> { return this._onConnected; }
    public get onConnectionException(): ISocketChange<SocketChange, Socket> { return this._onConnectionException; }
    public get onConnectionRestore(): ISocketChange<SocketChange, Socket> { return this._onConnectionRestore; }
    public get onDisconnected(): ISocketChange<SocketChange, Socket> { return this._onDisconnected; }
    public get onNotConnected(): ISocketNotConnected<SocketNotConnected, Socket> { return this._onNotConnected; }
    public get onNetworkDelay(): ISocketNetworkDelay<SocketNetworkDelay, Socket> { return this._onNetworkDelay; }
    public get readyState(): number {
        Assert.handle(Assert.Type.CreateObjectException, this._socket, "游戏Socket对象");
        return this._socket.readyState;
    }

    /**
     * 初始化心跳消息
     * @param heartbeatMessageName 心跳消息协议
     */
    public initHeartbeat(heartbeatMessageName: string) {
        this._heartbeat = this.retrieveMsg(heartbeatMessageName) as ISocketMessage_extend;
    }

    public setTimeoutInterval(interval: number) {
        this._timeoutCheckTask.setTimeInterval(interval);
        this._heartbeatTimerTask.setTimeInterval(2*interval);
    }

    /**
     * 发起连接socket
     * @param url socket服务器地址
     * @param protocol 传输的数据类型
     */
    public connect(url: string, protocol: cc_zest_socket_protocol) {
        return new Promise<void>((resolve, reject) => {
            if (Assert.handle(Assert.Type.CreateObjectException, this._socket, "游戏Socket")) {
                this._url = url;
                this._socket.protocolType = protocol;
                const classRef = js.getClassByName(protocol);
                this._socketProtocol = new classRef(this) as ISocketProtocol;
                this._socket.connect(url).then(() => {
                    this.registerEvent();
                    Debug.info('socket url:', url);
                    resolve();
                }).catch(err => reject(err));
            }
            else {
                reject("未知错误");
            }
        });
    }

    /**重连 */
    public reconnect() {
        this._socket.connect(this._url).then(() => {
            this.registerEvent();
        });
    }

    /**
     * 正常主动关闭连接，关闭后不会再重连，谨慎调用
     */
    public close() {
        if (this._socket) {
            this._socket.close(SocketEnum.Normal_Closure, errMsg[SocketEnum.Normal_Closure]);
        }
    }

    /**
     * 获取消息代理对象
     * @param proxyName 
     * @returns 返回指定的消息代理对象
     */
    public get<T>(proxyName: string, _type: new () => T): cc_zest_socket_message<T> {
        return this.retrieveMsg(proxyName) as cc_zest_socket_message<T>;
    }

    public encodingData(sockData: string) {
        if (this._socket.readyState === GameSocket.OPEN) {
            this._sendQueue.push(sockData);
            while(!this._sendQueue.isEmpty()) {
                const data = this._sendQueue.pop();
                this._socketProtocol.encodingData(data);
            }
        }
        else {
            this._sendQueue.push(sockData);
        }
        this._timeoutCheckTask.setTimerTask();
    }

    public sendData(data: any) {
        if (!this._socket) {
            return;
        }
        
        this._socket.send(data);
        this._msgTimestamp = new Date().getTime();
    }

    public dispatchData(data: string) {
        const proxyName = data.split("|")[0]; //去除消息字符串中的proxyName；
        const proxy = this.retrieveMsg(proxyName) as ISocketMessage_extend;
        proxy.dispatch(data);
    }

    private registerEvent() {
        this._socket.onOpen(this.onOpen.bind(this));
        this._socket.onMessage(this.onMessage.bind(this));
        this._socket.onClose(this.onClose.bind(this));
        this._socket.onError(this.onError.bind(this));
    }

    private onOpen() {
        Debug.info(this._socket.toString(), 'Socket open successfuly!');
        this._currentLinkCount = 0;
        const onConnected = this.onConnected;
        if (onConnected.active) onConnected.dispatch();
        this._timeoutCheckTask.moveTimerTask();
        //服务器连接成功后，发送第一个心跳包，然后打开定时器，以固定的时间间隔发送心跳包
        this.sendHeartbeat();
        this._heartbeatTimerTask.setTimerTask();
        this.resetTimeoutStatus();
    }

    private onMessage(data: IResponseSocketData) {
        if (!this._socket) {
            return;
        }
        this._socketProtocol.decodingData(data);
        this.resetTimeoutStatus();
    }

    private onError() {
        Debug.error('socket 连接发生错误');
        this._heartbeatTimerTask.moveTimerTask();
        this.handleDisconnect(SocketEnum.Not_Network, errMsg[SocketEnum.Not_Network]);
    }

    private onClose(res: {code: number, reason: string}) {
        Debug.info('socket 关闭:', res.code);
        this._heartbeatTimerTask.moveTimerTask();
        let msg: string = "";
        if (res.code in errMsg) {
            msg = errMsg[res.code];
            Debug.error(errMsg[res.code]);
        }
        this.handleClose(res.code, msg);
    }

    private handleClose(code: number, reason: string) {
        if (code !== 1000) {
            //心跳包无法在规定时间内接收到, 或发生其他因玩家操作问题导致的断线情况, 处理断线重连
            if (this._currentLinkCount === this._linkCountMax) {
                this.handleDisconnect(SocketEnum.Poor_Network, errMsg[SocketEnum.Poor_Network]);
            }
            else {
                this.handleDisconnect(code, reason);
            }
        }
    }

    private handleDisconnect(code: number, reason: string) {
        if (code === SocketEnum.Poor_Network || code === SocketEnum.Not_Network) {
            this._currentLinkCount = 0;
            const onNotConnected = this.onNotConnected;
            if (onNotConnected.active) onNotConnected.dispatch(code, reason);
        }
        else {
            if (this._currentLinkCount === 0) {
                const onDisconnected = this.onDisconnected;
                if (onDisconnected.active) onDisconnected.dispatch();
            }
            this._currentLinkCount++;
            Debug.info('发起断线重连，重连次数', this._currentLinkCount);
            this.reconnect();
        }
    }

    //重置超时状态
    private resetTimeoutStatus() {
        //有消息过来时, 关闭连接超时选择计时器, 防止主动进行断线重连, 服务器有消息过来, 则说明没有断线
        this._timeoutCheckTask.moveTimerTask();
        const onNetworkDelay = this.onNetworkDelay;
        if (onNetworkDelay.active) {
            onNetworkDelay.dispatch(new Date().getTime() - this._msgTimestamp);
        }

        //等于1是因为有一个心跳时间请求没有任何反应
        if (this._currentExceptionCount > 0) {
            Debug.info('异常连接重新恢复了连接');
            this._currentExceptionCount = 0;
            const onConnectionRestore = this.onConnectionRestore;
            if (onConnectionRestore.active) {
                onConnectionRestore.dispatch();
            }
        }
    }

    private sendHeartbeat() {
        //发送一个最小的数据量，一个字节的数据
        this._heartbeat.send(0x00);
    }

    private onTimeoutCheck(timeoutCount: number) {
        this._currentExceptionCount = timeoutCount;;
        if (timeoutCount === 1) {
            this.sendHeartbeat();
            const onConnectionException = this.onConnectionException;
            if (onConnectionException.active) {
                onConnectionException.dispatch();
            }
        }
        else if (timeoutCount === this._timeoutCountMax) {
            this._socket.close(SocketEnum.Connection_Timeout, errMsg[SocketEnum.Connection_Timeout]);
        }
    }

    private retrieveMsg(proxyName: string): ISocketMessage<any, any> {
        //此处保存消息对象不使用App.game.registerProxy接口，是因为要保持接收消息，遍历查找对应的消息的效率。
        if (proxyName in this._msgMap) {
            return this._msgMap[proxyName];
        }
        const msgRef = js.getClassByName(proxyName) as Constructor;
        if (Assert.handle(Assert.Type.GetSocketMessageClassException, msgRef, proxyName)) {
            const msg = new msgRef(proxyName);
            this._msgMap[proxyName] = msg;
            return msg as ISocketMessage<any, any>;
        }
    }
}
