import { EndEntityCommandBufferSystem } from "./EndEntityCommandBufferSystem";


export class EndSimulationEntityCommandBufferSystem extends EndEntityCommandBufferSystem {
    
    protected onUpdate(dt: number): void {
        this.applyJobHandler();
    }
}