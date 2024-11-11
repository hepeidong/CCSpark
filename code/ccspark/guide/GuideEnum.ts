
export enum GuideNormalEvent {
    HIDE_BLOCK_INPUT_LAYER = 'hide_block_input_layer',
    FINGER_EVENT = 'finger_event',
    DIALOGUE_EVENT = 'dialogue_event',
    TEXT_EVENT = 'text_event',
    AGAIN_EXECUTE = 'again_execute'
}

 /**引导高亮的显示范围 */
 export enum Scope {    
   /**整个窗口高亮显示 */
   ENTIRE_PANEL = 1,
   /**窗口部分高亮显示，高亮显示的是引导的目标节点  */
   PARTIAL_PANEL
}
/**引导事件类型 */
export enum EventType {
   /**开始引导 */
   GUIDE_START = 'guide_start',
   /**每一步引导完成 */
   GUIDE_COMPLETE = 'guide_complete',
   /**引导结束 */
   GUIDE_OVER = 'guide_over'
}
/**引导类型 */
export enum GuideType {
   /**手指引导 */
   FINGER,
   /**对话引导 */
   DIALOGUE,
   /**文本引导 */
   TEXT,
   /**图片引导 */
   IMAGE,
   /**动画引导 */
   ANIMATION
}

export enum ActorMoveModel {
   MOVE = "move",
   FADE_IN = "fadeIn",
   FADE_OUT = "fadeOut"
}

export enum ActorAction {
   DIALOG = "dialog",
   INTO = "into",
   OUT = "out"
}

export enum SourceType {
   IMAGE = "image",
   SPINE = "spine",
   DRAGON_BONES = "dragonBones"
}

export const TweenEasingType =
['linear'    , 'smooth'     , 'fade'         , 'constant'     ,
'quadIn'    , 'quadOut'    , 'quadInOut'    , 'quadOutIn'    ,
'cubicIn'   , 'cubicOut'   , 'cubicInOut'   , 'cubicOutIn'   ,
'quartIn'   , 'quartOut'   , 'quartInOut'   , 'quartOutIn'   , 
'quintIn'   , 'quintOut'   , 'quintInOut'   , 'quintOutIn'   ,
'sineIn'    , 'sineOut'    , 'sineInOut'    , 'sineOutIn'    ,
'expoIn'    , 'expoOut'    , 'expoInOut'    , 'expoOutIn'    ,
'circIn'    , 'circOut'    , 'circInOut'    , 'circOutIn'    ,
'elasticIn' , 'elasticOut' , 'elasticInOut' , 'elasticOutIn' ,
'backIn'    , 'backOut'    , 'backInOut'    , 'backOutIn'    ,
'bounceIn'  , 'bounceOut'  , 'bounceInOut'  , 'bounceOutIn'];