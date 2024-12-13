declare namespace config {

}
interface IFileData {
	
}
type cc_zest_file_data = {
	[K in keyof IFileData]: Readonly<IFileData[K]>;
}/**配置表文件容器类型 */
interface IContainer<T> {
    readonly keys: number[]|string[];
    readonly length: number;
    readonly fields: cc_zest_file_field_type<T>;
    /**
     * 根据id获取配置表的数据
     * @param id 
     * @returns 返回对应的id的配置表对象
     */
    get(id: number|string): T;
    /**
     * 获取当前表中的这个字段的值的累加，只有这个字段数据类型为number时才有用
     * @param field 当前配置表字段名
     * @returns 返回这个字段在当前配置表中的值的累加，如果数据类型不是number，则返回null
     */
    getSumOf(field: string): number|null;
    /**
     * 遍历当前配置表
     * @param callback 
     */
    forEach(callback: (value: T, index: number) => void): void;
    /**
     * 是否存在这个id的数据
     * @param id 
     */
    contains(id: number|string): boolean;
}
type cc_zest_file_field<T> = { [K in keyof T]: K; }
type cc_zest_file_field_type<T> =  Readonly<cc_zest_file_field<T>>;