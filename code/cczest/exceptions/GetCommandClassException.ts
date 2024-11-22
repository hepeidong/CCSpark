import { decorator } from "../decorator/Decorator";
import { GetClassException } from "./GetClassException";

const {ccsclass} = decorator;

@ccsclass("GetCommandClassException")
export class GetCommandClassException extends GetClassException {
    constructor(message: string, classRef: Function) {
        super(`不存在 “${message}” Command！`, classRef);
    }
}