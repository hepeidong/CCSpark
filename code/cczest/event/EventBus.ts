import { js } from "cc";
import { Constructor, IGameObserver, IGameSubject, IEventBus } from "../lib.zest";
import { Debug } from "../Debugger";
import { Assert } from "../exceptions/Assert";
import { GameSubject } from "./GameSubject";

/**
 * 游戏事件系统, 采用观察者模式设计
 */
export class EventBus implements IEventBus {
    private _subjectMap: Map<string, IGameSubject<any>>;
    constructor() {
        this._subjectMap = new Map();
    }

    private addSubject(subjectName: string) {
        if (!this._subjectMap.has(subjectName)) {
            this._subjectMap.set(subjectName, new GameSubject(subjectName));
            return true;
        }
        return false;
    }

    private createObserver(observerName: string) {
        const classRef = js.getClassByName(observerName) as Constructor;
        if (Assert.handle(Assert.Type.GetObserverClassException, classRef, observerName)) {
            const observer = new classRef(observerName) as IGameObserver<any>;
            observer.onCreate();
            return observer;
        }
        return null;
    }

    public addObserver(subjectName: string, observerName: string) {
        let subject: IGameSubject<any>;
        if (this._subjectMap.has(subjectName)) {
            subject = this._subjectMap.get(subjectName);
        }
        else if (this.addSubject(subjectName)) {
            subject = this._subjectMap.get(subjectName);
        }
        const observer = this.createObserver(observerName);
        return subject.addObserver(observer);
    }

    public getObserver<T extends IGameObserver<any>>(observerName: string) {
        let observer: T;
        this._subjectMap.forEach(subject => {
            if (subject.hasObserver(observerName)) {
                observer = subject.getObserver(observerName) as T;
                return;
            }
        });
        return observer;
    }

    public getObserverBySuject<T extends IGameObserver<any>>(subjectName: string, observerName: string) {
        if (this._subjectMap.has(subjectName)) {
            const subject = this._subjectMap.get(subjectName);
            return subject.getObserver(observerName) as T;
        }
        Debug.error(`主题 “${subjectName}” 不存在！`);
        return null;
    }

    public sendNotify<T>(subjectName: string, data: T, type: string = "") {
        if (this._subjectMap.has(subjectName)) {
            const subject = this._subjectMap.get(subjectName);
            subject.notify(data, type);
        }
    }

    public removeSubject(subjectName: string) {
        return this._subjectMap.delete(subjectName);
    }

    public removeObserver(subjectName: string, observerName: string) {
        if (this._subjectMap.has(subjectName)) {
            const subject = this._subjectMap.get(subjectName);
            return subject.removeObserver(observerName);
        }
        return false;
    }

    public clear() {
        this._subjectMap.clear(); 
    }
}