import { decorator } from "../decorator/Decorator";
import { GetClassException } from "./GetClassException";

const {zestClass} = decorator;

@zestClass("GetSceneClassException")
export class GetSceneClassException extends GetClassException {
    constructor(message: string, classRef: Function) {
        super(`不存在 “${message}” 场景！`, classRef);
    }
}