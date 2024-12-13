import { IBaseEntity, IEndEntityCommandBufferSystem, ISystem, JobEntityMethod } from "../lib.zest";
import { EntityCommandBufferSystem } from "./EntityCommandBufferSystem";
import { JobEntityHandler } from "./JobEntityHandler";

export class EndEntityCommandBufferSystem extends EntityCommandBufferSystem implements IEndEntityCommandBufferSystem {

    public scheduler<T extends IBaseEntity>(thisArg: ISystem, method: JobEntityMethod<T>, entity: T) {
        let handler: JobEntityHandler<T>;
        if (this._handlerPool.size() > 0) {
            handler = this._handlerPool.get() as JobEntityHandler<T>;
            handler.setMethod(method);
            handler.setEntity(entity);
        }
        else {
            handler = JobEntityHandler.create(entity, method) as JobEntityHandler<T>;
        }
        handler.scheduler(thisArg);
        this.addJobHandler(handler);
    }

    public removeSame<T extends IBaseEntity>(entity: T) {
        for (let i = 0; i < this._jobQueue.length; ++i) {
            const job = this._jobQueue.back(i) as JobEntityHandler<T>;
            if (job.id === entity.ID) {
                this._jobQueue.removeAt(i);
                return true;
            }
        }
        return false;
    }

    protected applyJobHandler() {
        if (!this._jobQueue.isEmpty()) {
            const handler = this._jobQueue.pop();
            handler.apply();
            this._handlerPool.put(handler);
        }
    }
}