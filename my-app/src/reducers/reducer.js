import {CHANGE_LEVEL} from "../actions/actions";


const initialState ={
    leveltype: 0
};


function rootReducer(state = initialState, action){
    switch(action.type){
        case CHANGE_LEVEL:
            return {
                leveltype: action.leveltype
            };
        default:
            return state;
    }
}

export default rootReducer;
