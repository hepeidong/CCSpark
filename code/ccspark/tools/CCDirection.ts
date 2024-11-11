class DirectionState {
    protected _state: Direction.Type;
    constructor() {
        this._state = Direction.Type.None;
    }

    public getState(angle: number) { return this._state; }

    protected juageState(condition: boolean, state: Direction.Type) {
        if (condition) {
            this._state = state;
        }
        else {
            this._state = Direction.Type.None;
        }
    }
}

class EastState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle < 22.5 || angle >= 337.5, Direction.Type.East);
        return this._state;
    }
}

class NortheastState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle >= 22.5 && angle < 67.5, Direction.Type.Northeast);
        return this._state;
    }
}

class NorthState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle >= 67.5 && angle < 112.5, Direction.Type.North);
        return this._state;
    }
}

class NorthwestState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle >= 112.5 && angle < 157.5, Direction.Type.Northwest);
        return this._state;
    }
}

class WestState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle >= 157.5 && angle < 202.5, Direction.Type.West);
        return this._state;
    }
}

class SouthwestState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle >= 202.5 && angle < 247.5, Direction.Type.Southwest);
        return this._state;
    }
}

class SouthState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle >= 247.5 && angle < 292.5, Direction.Type.South);
        return this._state;
    }
}

class SoutheastState extends DirectionState {
    public getState(angle: number): Direction.Type {
        this.juageState(angle >= 292.5 && angle < 337.5, Direction.Type.Southeast);
        return this._state;
    }
}

export class CCDirection {
    private static _rockingStateList: DirectionState[];


    /**
     * 根据角度获取此角度所处的方位
     * @param angle 
     * @returns 
     */
    public static getDirection(angle: number) {
        this.init();
        for (const rockingState of this._rockingStateList) {
            const state = rockingState.getState(angle);
            if (state !== Direction.Type.None) {
                return state;
            }
        }
        return Direction.Type.None;
    }

    private static init() {
        if (!Array.isArray(this._rockingStateList)) {
            this._rockingStateList = [
                new EastState(),
                new NortheastState(),
                new NorthState(),
                new NorthwestState(),
                new WestState(),
                new SouthwestState(),
                new SouthState(),
                new SoutheastState()
            ];
        }
    }
}

export namespace Direction {
    export enum Type {
        None,
        East,        //东
        North,       //北
        West,        //西
        South,       //南
        Northeast,   //东北
        Northwest,   //西北
        Southwest,   //西南
        Southeast    //东南
    }
}
