import { IBaseEntity } from "../lib.zest";


export function createMap (forceDictMode?: boolean): any {
    const map = Object.create(null);
    if (forceDictMode) {
        const INVALID_IDENTIFIER_1 = '.';
        const INVALID_IDENTIFIER_2 = '/';
        // assign dummy values on the object
        map[INVALID_IDENTIFIER_1] = 1;
        map[INVALID_IDENTIFIER_2] = 1;
        delete map[INVALID_IDENTIFIER_1];
        delete map[INVALID_IDENTIFIER_2];
    }
    return map;
}

export function has(obj: any, key: string) {
    return key in obj;
}

export function removeElement(array: any[], i: number, len?: number) {
    if (i < array.length - 1) {
        array[i] = array[array.length - 1];
    }
    delete array[array.length - 1];
    array.length--;
    if (typeof len === 'number') {
        len = array.length;
    }
    i--;
    return {i, len};
}

export function entityIndexOf(array: IBaseEntity[], member: IBaseEntity) {
    for (let i: number = 0, len = array.length; i < len; ++i) {
        if (array[i].ID === member.ID) {
            return i;
        }
    }
    return -1;
}

export function asUpdateBefore(o: any) {
    return o["updateBefore"];
}

export function asUpdateAfter(o: any) {
    return o["updateAfter"];
}

export function asUpdateInGroup(o: any) {
    return o["updateInGroup"];
}

export enum SystemGroupType {
    initialization = 'initialization',
    simulation = 'simulation',
    presentation = 'presentation',
    custom = 'custom'
}