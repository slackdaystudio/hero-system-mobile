import { Alert } from 'react-native';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const SET_CHARACTER = 'SET_CHARACTER';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setCharacter(character) {
    return {
        type: SET_CHARACTER,
        payload: character
    }
}

initialState = {};

export default function character(state = initialState, action) {
    let newState = null

    switch (action.type) {
        case SET_CHARACTER:
            newState = {...state};
            newState = action.payload;
            
            return newState;
        default:
            return state;
    }
}
