import { Exception } from "../../exceptions/Exception";

export class EntityAlreadyDestroyedException extends Exception {
    constructor(message: string) {
        super(message + "\nThe Entity already destroyed.")
    }
}