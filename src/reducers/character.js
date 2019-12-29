import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const GET_CHARACTER = 'GET_CHARACTER';

export const SET_CHARACTER = 'SET_CHARACTER';

export const SET_SHOW_SECONDARY = 'SET_SHOW_SECONDARY';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setCharacter(character) {
    return {
        type: SET_CHARACTER,
        payload: character
    }
}

export function getCharacter(xml) {
    return {
        type: GET_CHARACTER,
        payload: xml
    }
}

export function setShowSecondary(show) {
    return async (dispatch) => {
        common.setShowSecondaryCharacteristics(show).then(value => {
            dispatch({
                type: SET_SHOW_SECONDARY,
                payload: value
            });
        });
    };
}

initialState = {
    character: null,
    showSecondary: true
};

export default function character(state = initialState, action) {
    let newState = null

    switch (action.type) {
        case GET_CHARACTER:
            newState = {...state};
            newState.character = heroDesignerCharacter.getCharacter(action.payload);

            return newState;
        case SET_CHARACTER:
            newState = {...state};
            newState.character = action.payload;
            
            return newState;
        case SET_SHOW_SECONDARY:
            newState = {...state};
            newState.showSecondary = action.payload;

            return newState;
        default:
            return state;
    }
}
