export const CHANGE_LEVEL  = "CHANGE_LEVEL";

export function changelevel(level){
    return {type: CHANGE_LEVEL, leveltype: level};
}