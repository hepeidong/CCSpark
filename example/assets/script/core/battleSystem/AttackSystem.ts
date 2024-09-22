import { Debug, IEntity, decorator, ecs } from "../../cck";
import { NpcType } from "../../lib/NpcTypeEnum";
import { Hero } from "../view/battleView/Hero";
import { FineEnemySystem } from "./FineEnemySystem";
import { AttackTarget, DataType, HeroWeapon, NpcIdentity } from "./dataType";

const {cckclass, updateAfter, updateInGroup} = decorator;

interface IAttackEntity extends IEntity {
    NpcIdentity: NpcIdentity;
    AttackTarget: AttackTarget;
    HeroWeapon: HeroWeapon;
}

@cckclass("AttackSystem")
@updateInGroup(ecs.SimulationGroup)
@updateAfter(FineEnemySystem)
export class AttackSystem extends ecs.System<IAttackEntity> {

    protected onUpdate(dt: number): void {
        this.matcher.withAll(DataType.NpcIdentity, DataType.AttackTarget).withAny(DataType.HeroWeapon).forEach(entity => {
            const obj = entity.node.getComponent(Hero);
            const time = entity.HeroWeapon.attackDistance / entity.HeroWeapon.bulletSpeed;
            obj.gunFire(time, entity.AttackTarget.target);
            if (entity.hasComponent(DataType.AttackTarget)) {
                entity.removeComponent(DataType.AttackTarget);
            }
        });
    }
}