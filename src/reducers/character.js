import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const GET_CHARACTER = 'GET_CHARACTER';

export const SET_CHARACTER = 'SET_CHARACTER';

export const INITIALIZE_CHARACTER = 'INITIALIZE_CHARACTER';

export const SET_SHOW_SECONDARY = 'SET_SHOW_SECONDARY';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setCharacter(character) {
    return async (dispatch) => {
        persistence.setCharacter(character).then(char => {
            dispatch({
                type: SET_CHARACTER,
                payload: char
            });
        });
    };
}

export function initializeCharacter() {
    return async (dispatch) => {
        persistence.getCharacter().then(char => {
            dispatch({
                type: INITIALIZE_CHARACTER,
                payload: char
            });
        });
    };
}

export function setShowSecondary(show) {
    return async (dispatch) => {
        persistence.setShowSecondaryCharacteristics(show).then(value => {
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
        case SET_CHARACTER:
            newState = {
                ...state,
                character: {
                    ...state.character
                }
            };
            newState.character = action.payload;
            
            return newState;
        case INITIALIZE_CHARACTER:
            if (action.payload === null) {
                return state;
            }

            newState = {
                ...state,
                character: {
                    ...state.character
                }
            };
            newState.character = action.payload;

            return newState;
        case SET_SHOW_SECONDARY:
            newState = {
                ...state,
                showSecondary: {
                    ...state.showSecondary
                }
            };
            newState.showSecondary = action.payload;

            return newState;
        default:
            return state;
    }
}
