import { DEBUG } from "cc/env";

var _debug = false;

export function setEcsDebug(debug: boolean) {
    _debug = debug;
}

function getEcsDebug() {
    if (DEBUG) {
        return _debug;
    }
    return false;
}

export var ECS_DEBUG: boolean = getEcsDebug();