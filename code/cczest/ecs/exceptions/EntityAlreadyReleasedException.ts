import { Exception } from "../../exceptions/Exception";

export class EntityAlreadyReleasedException extends Exception {
    constructor(message: string) {
        super(message + "\nThe Entity already released.");
    }
}