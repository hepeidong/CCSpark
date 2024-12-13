import { decorator } from "../decorator";
import { Encode, EncryptAlgorithm } from "./EncryptAlgorithm";

const {zestClass} = decorator;

@zestClass("RSAOAEP")
export class RSAOAEP extends EncryptAlgorithm<CryptoKeyPair> {
    constructor() {
        super();
    }

    private async createRSA() {
        const keyPair = await crypto.subtle.generateKey(
            {
              name: "RSA-OAEP",
              modulusLength: 2048,
              publicExponent: new Uint8Array([1, 0, 1]),
              hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
          );
        return keyPair;
    }

    public async createCryptoKey(): Promise<void> {
        this.secretkey = await this.createRSA();
    }

    public async encrypt(data: string): Promise<Encode> {
        const buffer = this.stringToArrayBuffer(data);
        const enbuffer = await crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            this.secretkey.publicKey,
            buffer
        );
        return this.arrayBufferToEncode(enbuffer);
    }

    public async decrypt(encode: Encode): Promise<string> {
        const decode = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            this.secretkey.privateKey,
            this.encodeToUint8Array(encode)
        );
          return this.arrayBufferToString(decode);
    }
}