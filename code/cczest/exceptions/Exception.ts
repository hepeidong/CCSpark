export class Exception {
    /** @type {string} */
    private message: string;

    /**
     * Base exception class
     * @constructot
     * @param message
     */
    constructor(message: string) {
      this.message = message
    }
    /** @return {string} */
    public toString(): string {
      return `Exception: ${this.message}`;
    }
    /**异常处理 */
    public handle() {return true; }
}