import { Exception } from "../../exceptions/Exception";

export class SystemDoesNotHaveNameException extends Exception {
    constructor(index: number, message: string) {
        super(message + "\nThe System does not have a name at index (" + index + ").");
    }
}