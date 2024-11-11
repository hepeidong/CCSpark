export enum Type {
    /**不是任何类型的视图，非法的选项，不可选择 */
    NONE = -1,
    /**根视图 */
    ROOT,
    /**普通视图 */
    DIALOG,
    /**活动视图 */
    ACTIVITY,
    /**冒泡提示视图 */
    TOAST,
    /**最顶层视图 */
    TOP
}