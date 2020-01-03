import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const INITIALIZE_SETTINGS = 'INITIALIZE_SETTINGS';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeApplicationSettings() {
    return async (dispatch) => {
        persistence.initializeApplicationSettings().then(settings => {
            dispatch({
                type: INITIALIZE_SETTINGS,
                payload: settings
            });
        });
    };
}

initialState = {};

export default function settings(state = initialState, action) {
    let newState = null

    switch (action.type) {
        case INITIALIZE_SETTINGS:
            newState = {...state};
            newState = action.payload;

            return newState;
        default:
            return state;
    }
}
