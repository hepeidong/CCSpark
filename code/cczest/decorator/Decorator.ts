import { js } from "cc";
import { EDITOR } from "cc/env";
import { Constructor, IBaseEntity, IConvertToEntity, ISystem, ISystemGroup } from "zest";
import { STARTUP } from "../Define";
import { setBundle, setHttpMethod, setHttpUrl, setModel, setProp, setStartScene, setTemplate, setUpdateAfter, setUpdateBefore, setUpdateInGroup } from "./Decorator_setup";


type ParentType = {
    system: Function,
    redDot: Function,
    gameWorld: Function
}


const redDotActionClassNames = [];
const systemClassNames = [];
const parentMap: ParentType = {
    system: null,
    redDot: null,
    gameWorld: null
}

function addClassName(array: string[], className: string) {
    if (array.indexOf(className) === -1) {
        array.push(className);
        return;
    }
    throw new Error("类名为'" + className + "'的类重复定义");
}

export function getRedDotActionClassNames() {
    return redDotActionClassNames;
}

export function getSystemClassNames() {
    return systemClassNames;
}

export function setParentType(key: string, type: Function) {
    parentMap[key] = type;
}


/**
 * 设置游戏的初始场景
 * @param sceneName 
 * @returns 
 */
function startScene(sceneName: string) {
    return function (constructor: Function) {
        setStartScene(sceneName, constructor);
    }
}


/**
 * 框架的类装饰器，用于声明类，当你需要通过js.getClassByName获取该类时，则可以使用此装饰器装饰你的类，
 * 要注意，框架中有些类是必须要使用此装饰器装饰的。
 * @param className 你的类名
 */
function zestClass(className: string): Function;
function zestClass<T>(constructor: {new (): T}): new () => T;
function zestClass() {
    if (EDITOR) {
        return function () {}
    }
    if (typeof arguments[0] === "string") {
        const className = arguments[0];
        if (className.length === 0) {
            throw new Error('装饰器无法获取到类名，请使用 zestClass("该类的类名") 方式装饰你的类！');
        }
        return function (constructor: Function) {
            if (js.isChildClassOf(constructor, parentMap.gameWorld)) {
                STARTUP.name = className;
            }
            else if (js.isChildClassOf(constructor, parentMap.system)) {
                //ECS中的System的子类
                addClassName(systemClassNames, className);
            }
            else if (js.isChildClassOf(constructor, parentMap.redDot)) {
                addClassName(redDotActionClassNames, className);
            }
            js.setClassName(className, constructor as Constructor);
            return constructor;
        }
    }
    else {
        let constructor = arguments[0];
        const className = js.getClassName(constructor);
        if (className.length === 0) {
            throw new Error('装饰器无法获取到类名，请使用 zestClass("该类的类名") 方式装饰你的类！');
        }
        if (js.isChildClassOf(constructor, parentMap.gameWorld)) {
            STARTUP.name = className;
        }
        else if (js.isChildClassOf(constructor, parentMap.system)) {
            //ECS中的System的子类
            addClassName(systemClassNames, className);
        }
        else if (js.isChildClassOf(constructor, parentMap.redDot)) {
            addClassName(redDotActionClassNames, className);
        }
        js.setClassName(className, constructor);
        return constructor;
    }   
}

/**
 * GameWindow模板依赖装饰器，用于记录GameWindow所依赖的模板预制体
 * @param path GameWindow的模板预制体所在的相对路径
 * @returns 
 */
function template(path: string) {
    if (EDITOR) {
        return function () {}
    }
    return function (constructor: Function) {
        setTemplate(path, constructor);
    }
}

/**
 * GameWindow所依赖的资源包，注意每一个GameWindow只能依赖一个资源包，如果你的GameWindow没用依赖的资源包，则不需要使用此装饰器装饰你的类,
 * 你的GameWindow所依赖的预制体，图片等资源如果都是在resources目录下的，也不需要此装饰器装饰装饰你的类
 * @param nameOrUrl 资源包名或者资源包的远程 url
 */
function bundle(nameOrUrl: string) {
    if (EDITOR) {
        return function () {}
    }
    return function (constructor: Function) {
        setBundle(nameOrUrl, constructor);
    }
}


function setPropKeys(target: any, key: string) {
    if (EDITOR) {
        return function () {}
    }
    if (!target.constructor.prototype.hasOwnProperty('propKeys')) {
        setProp([key], target.constructor);
    }
    else {
        const descritor = Object.getOwnPropertyDescriptor(target.constructor.prototype, "propKeys");
        const keys = descritor.value as Array<string>;
        keys.push(key);
    }
}

/**
 * 属性装饰器，可以对类的属性进行装饰
 * @param target 
 * @param key 
 * @returns 
 */
function prop(target: any, key: string): void {
    setPropKeys(target, key);
}

/**
 * 模型数据结构装饰器，对具体的Document模型进行数据结构装饰
 * @param target 
 * @returns 
 */
function model(target: {new (): any}) {
    if (EDITOR) {
        return function () {}
    }
    return function (constructor: Function) {
        setModel(new target(), constructor);
    }
}

/**
 * 设置http请求的URL，请求的方式
 * @param url 
 * @param method 
 * @returns 
 */
function http(url: string, method: string) {
    if (EDITOR) {
        return function () {}
    }
    return function (constructor: Function) {
        setHttpUrl(url, constructor);
        setHttpMethod(method, constructor);
    }
}

/**
 * 在指定的系统组内更新
 * @param target 
 */
function updateInGroup<T extends ISystemGroup>(target: {new (): T}) {
    if (EDITOR) {
        return function () {}
    }
    return function (constructor: Function) {
        setUpdateInGroup(target, constructor);
    }
}

/**
 * 在指定的系统之前更新
 * @param target 
 */
function updateBefore<T extends ISystem<IBaseEntity>>(target: {new (): T}) {
    if (EDITOR) {
        return function () {}
    }
    return function (constructor: Function) {
        setUpdateBefore(target, constructor);
    }
}

/**
 * 在指定的系统之后更新
 * @param target 
 */
function updateAfter<T extends ISystem<IBaseEntity>>(target: {new (): T}) {
    if (EDITOR) {
        return function () {}
    }
    return function (constructor: Function) {
        setUpdateAfter(target, constructor);
    }
}

let _classRefList = [];
function convertToEntity(target: Function extends IConvertToEntity ? Function : Function) {
    if (!EDITOR) {
        _classRefList.push(target.prototype);
    }
}

export function getClassRefList() { return _classRefList; }

export const decorator = {
    startScene,
    prop,
    model,
    http,
    zestClass,
    template,
    bundle,
    updateInGroup,
    updateBefore,
    updateAfter,
    convertToEntity
}