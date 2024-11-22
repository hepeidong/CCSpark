import { Exception } from "../../exceptions/Exception";

export class EntityIsNotEnabledException extends Exception {
    constructor(message: string) {
        super(message + "\nThe Entity is not enabled.");
    }
}