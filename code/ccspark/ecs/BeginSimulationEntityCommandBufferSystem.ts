import { BeginEntityCommandBufferSystem } from "./BeginEntityCommandBufferSystem";


export class BeginSimulationEntityCommandBufferSystem extends BeginEntityCommandBufferSystem {

    protected onUpdate(dt: number): void {
        this.applyJobHandler();
    }
}