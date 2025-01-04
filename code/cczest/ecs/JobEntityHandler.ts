import { IBaseEntity, JobEntityMethod } from "zest";
import { JobHandler } from "./JobHandler";


export class JobEntityHandler<T extends IBaseEntity> extends JobHandler<JobEntityMethod<T>> {
    private _id: string;
    private _entity: T;
    constructor(entity: T, method: JobEntityMethod<T>) {
        super(method);
        this._entity = entity;
    }

    public get id() { return this._id; }

    private setId(id: string) {
        this._id = id;
    }

    public static create(entity: IBaseEntity, method: JobEntityMethod<IBaseEntity>) {
        const handler = new JobEntityHandler(entity, method);
        handler.setId(entity.ID);
        return handler;
    }

    public apply(): void {
        this._method.apply(this._thisArg, [this._entity]);
    }

    public setEntity(entity: T) {
        this._entity = entity;
    }
}