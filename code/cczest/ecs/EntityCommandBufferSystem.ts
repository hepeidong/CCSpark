import { IBaseEntity, IListener } from "zest";
import { tools } from "../tools";
import { JobHandler } from "./JobHandler";
import { CCSystem } from "./System";

export class EntityCommandBufferSystem extends CCSystem<IBaseEntity> {
    protected _jobQueue: tools.Queue<JobHandler<any>>;
    protected _handlerPool: tools.ObjectPool<JobHandler<IListener>>;
    constructor() {
        super("EntityCommandBufferSystem");
        this._jobQueue = new tools.Queue();
        this._handlerPool = new tools.ObjectPool();
    }

    protected init() {}

    protected addJobHandler(handler: JobHandler<any>) {
        this._jobQueue.push(handler);
    }
}