import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const INITIALIZE_SETTINGS = 'INITIALIZE_SETTINGS';

export const USE_FIFTH_EDITION_RULES = 'USE_FIFTH_EDITION_RULES';

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

export function setUseFifthEditionRules(fifth) {
    return async (dispatch) => {
        persistence.setUseFifthEditionRules(fifth).then(useFifth => {
            dispatch({
                type: USE_FIFTH_EDITION_RULES,
                payload: useFifth
            });
        });
    };
}

settingsState = {};

export default function settings(state = settingsState, action) {
    let newState = null

    switch (action.type) {
        case INITIALIZE_SETTINGS:
            newState = {...state};
            newState = action.payload;

            return newState;
        case USE_FIFTH_EDITION_RULES:
            newState = {
                ...state,
                useFifthEdition: {
                    ...state.useFifthEdition
                }
            };

            newState.useFifthEdition = action.payload;

            return newState;
        default:
            return state;
    }
}
