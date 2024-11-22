import { _decorator, Component, Node } from 'cc';
import { IntersectHelper } from './IntersectHelper';
const { ccclass, property } = _decorator;

@ccclass('Intersections')
export class Intersections extends Component {

    protected _group: IntersectHelper[] = [];

    get group() { return this._group; }

    start() {

    }

    update(deltaTime: number) {
        
    }
}

