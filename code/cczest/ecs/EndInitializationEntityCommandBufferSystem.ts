import { EndEntityCommandBufferSystem } from "./EndEntityCommandBufferSystem";


export class EndInitializationEntityCommandBufferSystem extends EndEntityCommandBufferSystem {

    protected init() {}

    protected onUpdate(dt: number): void {
        this.applyJobHandler();
    }
}