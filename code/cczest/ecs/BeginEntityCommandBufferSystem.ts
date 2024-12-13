import { IBaseEntity, IBeginEntityCommandBufferSystem, IConversionSystem, ISystem, JobInitMethod } from "../lib.zest";
import { EntityCommandBufferSystem } from "./EntityCommandBufferSystem";
import { JobHandler } from "./JobHandler";
import { JobInitHandler } from "./JobInitHandler";

export class BeginEntityCommandBufferSystem extends EntityCommandBufferSystem implements IBeginEntityCommandBufferSystem {
    private _conversionSystem: IConversionSystem;
    constructor(conversionSystem: IConversionSystem) {
        super();
        this._conversionSystem = conversionSystem;
    }

    public scheduler<T extends IBaseEntity>(thisArg: ISystem, method: JobInitMethod<T>, componentType: number) {
        thisArg.matcher.withAll(componentType);
        if (thisArg.matcher.hasEntity()) {
            let handler: JobHandler<JobInitMethod<T>>;
            if (this._handlerPool.size() > 0) {
                handler = this._handlerPool.get();
                handler.setMethod(method);
            }
            else {
                handler = JobInitHandler.create(method);
            }
            handler.scheduler(thisArg);
            this.addJobHandler(handler);
        }
    }

    protected applyJobHandler() {
        if (!this._jobQueue.isEmpty()) {
            const handler = this._jobQueue.pop();
            handler.apply(this._conversionSystem);
            this._handlerPool.put(handler);
        }
    }
}