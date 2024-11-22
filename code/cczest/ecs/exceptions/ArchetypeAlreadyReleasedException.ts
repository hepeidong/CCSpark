import { Exception } from "../../exceptions/Exception";

export class ArchetypeAlreadyReleasedException extends Exception {
    constructor(message: string) {
        super(message + '\nThe Archetype already released.');
    }
}