export enum UIType {
    /**不是任何类型的视图，非法的选项，不可选择 */
    NONE = -1,
    /**根视图 */
    ROOT_LAYER,
    /**普通视图 */
    DIALOG_LAYER,
    /**活动视图 */
    ACTIVITY_LAYER,
    /**冒泡提示视图 */
    TOAST_LAYER,
    /**最顶层视图 */
    TOP_LAYER
}