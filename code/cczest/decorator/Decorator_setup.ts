type Prototype = {
    constructor: Function;
}


const value = (() => {
    const descriptor: PropertyDescriptor = {
        value: undefined,
        enumerable: false,
        writable: false,
        configurable: true,
    };
    return (object: Prototype, propertyName: string, value_: any, writable?: boolean, enumerable?: boolean) => {
        descriptor.value = value_;
        descriptor.writable = writable;
        descriptor.enumerable = enumerable;
        Object.defineProperty(object, propertyName, descriptor);
        descriptor.value = undefined;
    };
})();

function setup (tag: string) {
    return function (id: any, constructor: Function) {
        if (!constructor.prototype.hasOwnProperty(tag)) {
           value(constructor.prototype, tag, id);
        }
    };
}

export const setStartScene = setup("_startScene");
export const setBundle = setup("_bundleName");
export const setTemplate = setup("_assetPath");
export const setProp = setup("_propKeys");
export const setModel = setup("_data");
export const setHttpUrl = setup("_URL");
export const setHttpMethod = setup("_METHOD");
export const setUpdateInGroup = setup("updateInGroup");
export const setUpdateBefore = setup("updateBefore");
export const setUpdateAfter = setup("updateAfter");