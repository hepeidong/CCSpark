import { EndEntityCommandBufferSystem } from "./EndEntityCommandBufferSystem";


export class EndPresentationEntityCommandBufferSystem extends EndEntityCommandBufferSystem {

    protected onUpdate(dt: number): void {
        this.applyJobHandler();
    }
}