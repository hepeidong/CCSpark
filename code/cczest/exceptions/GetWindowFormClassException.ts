import { decorator } from "../decorator/Decorator";
import { GetClassException } from "./GetClassException";

const {zestClass} = decorator;

@zestClass("GetWindowFormClassException")
export class GetWindowFormClassException extends GetClassException {
    constructor(message: string, classRef: Function) {
        super(`不存在 “${message}” UI窗口！`, classRef);
    }
}