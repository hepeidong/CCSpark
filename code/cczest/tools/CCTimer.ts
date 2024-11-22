import { director, ISchedulable, Scheduler } from "cc";
import { utils, UUID } from "../utils";
import { CCObjectPool } from "./CCObjectPool";

export class CCTimer implements ISchedulable {
    private _id: string;
    private _uuid: string;
    private _interval: number;
    private _timeout: number;
    private _once: boolean;
    private _callback: (dt?: number) => void;

    private static _timerMap: Map<string, CCTimer> = new Map();
    private static _pool: CCObjectPool<CCTimer> = new CCObjectPool();
    private constructor(once: boolean) {
        this.reset(once);
    }

    public get id() { return this._id; }
    public get uuid() { return this._uuid; }

    private initSchedule(callback: (dt?: number) => void, interval: number, priority?: number, paused?: boolean) {
        this._callback = callback;
        this._interval = interval;
        
        if (utils.isUndefined(priority)) {
            priority = 0;
        }
        if (utils.isUndefined(paused)) {
            paused = false;
        }
        const scheduler: Scheduler = director.getScheduler();
        Scheduler.enableForTarget(this);
        scheduler.scheduleUpdate(this, priority, paused);
    }

    public reset(once: boolean) {
        this._uuid    = UUID.randomUUID();
        this._id      = "TimerTask." + this._uuid;
        this._timeout = 0;
        this._once    = once;
    }

    public static setTimeout(callback: (dt?: number) => void, interval: number, priority?: number, paused?: boolean) {
        let timer: CCTimer;
        if (this._pool.has()) {
            timer = this._pool.get();
            timer.reset(false);
        }
        else {
            timer = new CCTimer(false);
        }
        timer.initSchedule(callback, interval, priority, paused);
        this._timerMap.set(timer.uuid, timer);
        return timer.uuid;
    }

    public static setInterval(callback: (dt?: number) => void, interval: number, priority?: number, paused?: boolean) {
        let timer: CCTimer;
        if (this._pool.has()) {
            timer = this._pool.get();
            timer.reset(true);
        }
        else {
            timer = new CCTimer(true);
        }
        timer.initSchedule(callback, interval, priority, paused);
        this._timerMap.set(timer.uuid, timer);
        return timer.uuid;
    }

    public static clearTimeout(timerId: string) {
        if (this._timerMap.has(timerId)) {
            const timer = this._timerMap.get(timerId);
            const scheduler: Scheduler = director.getScheduler();
            scheduler.unscheduleUpdate(timer);
            this._timerMap.delete(timerId);
            this._pool.put(timer);
        }
    }

    update(dt: number) {
        this._timeout += dt;
        if (this._timeout >= this._interval) {
            this._callback(this._timeout);
            if (this._once) {
                CCTimer.clearTimeout(this.uuid);
            }
            else {
                this._timeout = 0;
            }
        }
    }
}