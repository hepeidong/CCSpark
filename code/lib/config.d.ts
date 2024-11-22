declare namespace config {
	export class Const{
		/**key */
		public readonly key: string;
		/**值 */
		public readonly value: number;
	}

	export class GameLevel{
		/**id  */
		public readonly id: number;
		/**需要击杀敌人数 */
		public readonly killsCount: number;
		/**敌人攻击力 */
		public readonly attack: number;
		/**敌人生命值 */
		public readonly HP: number;
	}

	export class HeroWeapon{
		/**id */
		public readonly id: number;
		/**武器名 */
		public readonly name: string;
		/**武器类型 */
		public readonly type: number;
		/**一次能发射的子弹个数 */
		public readonly bulletCount: number;
		/**子弹飞行速度 */
		public readonly bulletSpeed: number;
		/**子弹攻击力 */
		public readonly attack: number;
		/**子弹攻击距离 */
		public readonly attackDistance: number;
		/**武器CD */
		public readonly cd: number;
		/**等级 */
		public readonly level: number;
	}

	export class WeaponLevel{
		/**id */
		public readonly id: number;
		/**攻击力增长率 */
		public readonly attackRate: number;
		/**cd增长率 */
		public readonly cdRate: number;
		/**费用 */
		public readonly cost: number;
	}

	export class Hero{
		/**id */
		public readonly id: number;
		/**英雄名 */
		public readonly name: string;
		/**英雄生命值 */
		public readonly HP: number;
		/**当前等级 */
		public readonly level: number;
		/**初始经验 */
		public readonly exp: number;
	}

	export class HeroLevel{
		/**id */
		public readonly id: number;
		/**角色生命值 */
		public readonly HP: number;
		/**所需经验 */
		public readonly exp: number;
	}

	export class Enemy{
		/**id */
		public readonly id: number;
		/**名称 */
		public readonly name: string;
		/**生命值 */
		public readonly HP: number;
		/**攻击力 */
		public readonly attack: number;
	}

}
interface IFileData {
	Const?: IContainer<config.Const>;
	GameLevel?: IContainer<config.GameLevel>;
	HeroWeapon?: IContainer<config.HeroWeapon>;
	WeaponLevel?: IContainer<config.WeaponLevel>;
	Hero?: IContainer<config.Hero>;
	HeroLevel?: IContainer<config.HeroLevel>;
	Enemy?: IContainer<config.Enemy>;
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