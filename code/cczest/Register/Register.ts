import { EventSystem } from "../event";
import { IHandler, IRegister } from "zest";

export class Register implements IRegister {
    private _commands: string[];
    private _notificationNames: string[];  //消息名列表
    private _regHandlers: Map<string, IHandler>;//消息处理回调

    constructor() {
        this._commands = [];
        this._notificationNames = [];
        this._regHandlers = new Map();
    }

    public getCommands() { return this._commands; }
    public getNotificationNames() { return this._notificationNames; }

    public reg(notificationName: string, handler: (body: any, type: string) => void, target: any) {
        if (!this._regHandlers.has(notificationName)) {
            this._notificationNames.push(notificationName);
            this._regHandlers.set(notificationName, EventSystem.Handler.create(target, handler));
        }
    }

    public handle(notification: INotification): void {
        const name = notification.getName();
        if (this._regHandlers.has(name)) {
            const handler = this._regHandlers.get(name);
            handler.apply([notification.getBody(), notification.getType()]);
        }
    }

    public addCommand(command: string) {
        const index = this._commands.indexOf(command);
        if (index === -1) {
            this._commands.push(command);
        }
    }
}