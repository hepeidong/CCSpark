import { js } from "cc";
import { Constructor } from "../lib.ccspark";
import { Debug } from "../Debugger";
import { Exception } from "./Exception";

export class Assert {
    public static handle(exceptionType: string, condition: any, message?: string) {
        try {
            const exception = this.getException(exceptionType, condition, message);
            return exception.handle();
        } catch (error) {
            Debug.error(error);
            return false;
        }
    }

    private static getException(exceptionType: string, condition: any, message?: string) {
        const exceptionRef = js.getClassByName(exceptionType) as Constructor;
        const exception = new exceptionRef(message, condition);
        return exception as Exception;
    }
}


export namespace Assert {
    export enum Type {
        GetModelClassException = "GetModelClassException",
        GetHttpMessageClassException = "GetHttpMessageClassException",
        GetSocketMessageClassException = "GetSocketMessageClassException",
        GetWindowFormClassException = "GetWindowFormClassException",
        GetSceneClassException = "GetSceneClassException",
        GetCommandClassException = "GetCommandClassException",
        GetComponentException = "GetComponentException",
        InitSceneTypeException = "InitSceneTypeException",
        InitViewTypeException = "InitViewTypeException",
        LoadSceneException = "LoadSceneException",
        LoadAssetBundleException = "LoadAssetBundleException",
        CreateObjectException = "CreateObjectException",
        InsertEdgeException = "InsertEdgeException",
        DeleteEdgeException = "DeleteEdgeException",
        DeleteVertexException = "DeleteVertexException",
        LoadRemoteTextureException = "LoadRemoteTextureException",
        ToastManagerException = "ToastManagerException",
        GetObserverClassException = "GetObserverClassException",
        FindRedDotException = "FindRedDotException",
        RedDotAlreadyExistsException = "RedDotAlreadyExistsException",
        AudioSourceIDException = "AudioSourceIDException",
        ArrayIndexException = "ArrayIndexException",
        ConfigDataException = "ConfigDataException",
        CircularQueueException = "CircularQueueException"
    }
}
