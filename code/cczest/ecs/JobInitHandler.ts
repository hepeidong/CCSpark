import { IBaseEntity, JobInitMethod } from "../lib.ccspark";
import { ConversionSystem } from "./ConversionSystem";
import { JobHandler } from "./JobHandler";

export class JobInitHandler<T extends IBaseEntity> extends JobHandler<JobInitMethod<T>> {
    private constructor(method: JobInitMethod<T>) {
        super(method);
        this._method = method;
    }

    public static create(method: JobInitMethod<IBaseEntity>) {
        return new JobInitHandler(method);
    }

    public apply(conversionSystem: ConversionSystem) {
        this._thisArg.matcher.forEach(entity => {
            this._method.apply(this._thisArg, [entity, conversionSystem]);
        });
    }
}