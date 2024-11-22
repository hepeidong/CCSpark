import { BeginEntityCommandBufferSystem } from "./BeginEntityCommandBufferSystem";


export class BeginInitializationEntityCommandBufferSystem extends BeginEntityCommandBufferSystem {

    protected onUpdate(dt: number): void {
        this.applyJobHandler();
    }
}