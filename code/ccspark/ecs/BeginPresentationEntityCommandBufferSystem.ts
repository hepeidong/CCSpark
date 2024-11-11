import { BeginEntityCommandBufferSystem } from "./BeginEntityCommandBufferSystem";


export class BeginPresentationEntityCommandBufferSystem extends BeginEntityCommandBufferSystem {

    protected onUpdate(dt: number): void {
        this.applyJobHandler();
    }
}