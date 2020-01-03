import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const INITIALIZE_COMBAT_DETAILS = 'INITIALIZE_COMBAT_DETAILS';

export const SET_COMBAT_DETAILS = 'SET_COMBAT_DETAILS';

export const SET_SPARSE_COMBAT_DETAILS = 'SET_SPARSE_COMBAT_DETAILS';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeCombatDetails() {
    return async (dispatch) => {
        persistence.initializeCombatDetails().then(combatDetails => {
            dispatch({
                type: INITIALIZE_COMBAT_DETAILS,
                payload: combatDetails
            });
        });
    };
}

export function setCombatDetails(character) {
    return async (dispatch) => {
        persistence.setCombatDetails(character).then(combatDetails => {
            dispatch({
                type: SET_COMBAT_DETAILS,
                payload: combatDetails
            });
        });
    };
}

export function setSparseCombatDetails(sparseCombatDetails) {
    return async (dispatch) => {
        persistence.setSparseCombatDetails(sparseCombatDetails).then(combatDetails => {
            dispatch({
                type: SET_SPARSE_COMBAT_DETAILS,
                payload: combatDetails
            });
        });
    };
}

initialState = {};

export default function combat(state = initialState, action) {
    let newState = null

    switch (action.type) {
        case INITIALIZE_COMBAT_DETAILS:
        case SET_COMBAT_DETAILS:
        case SET_SPARSE_COMBAT_DETAILS:
            newState = {...state};
            newState = action.payload;

            return newState;
        default:
            return state;
    }
}
