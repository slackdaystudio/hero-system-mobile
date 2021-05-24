import { persistence } from '../lib/Persistence';



















export const INITIALIZE_SETTINGS = 'INITIALIZE_SETTINGS';

export const CLEAR_SETTINGS = 'CLEAR_SETTINGS';

export const TOGGLE_SETTING = 'TOGGLE_SETTING';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeApplicationSettings() {
    return async (dispatch) => {
        persistence.initializeApplicationSettings().then(settings => {
            dispatch({
                type: INITIALIZE_SETTINGS,
                payload: settings,
            });
        });
    };
}

export function clearApplicationSettings() {
    return async (dispatch) => {
        persistence.clearApplicationSettings().then(settings => {
            dispatch({
                type: CLEAR_SETTINGS,
                payload: settings,
            });
        });
    };
}

export function toggleSetting(key, value) {
    return async (dispatch) => {
        persistence.toggleSetting(key, value).then(settingValue => {
            dispatch({
                type: TOGGLE_SETTING,
                payload: {
                    key: key,
                    value: settingValue,
                },
            });
        });
    };
}

let settingsState = {};

export default function settings(state = settingsState, action) {
    let newState = null;

    switch (action.type) {
        case INITIALIZE_SETTINGS:
        case CLEAR_SETTINGS:
            newState = {
                ...state,
            };

            newState.useFifthEdition = action.payload.useFifthEdition;
            newState.playSounds = action.payload.playSounds;
            newState.onlyDiceSounds = action.payload.onlyDiceSounds;

            return newState;
        case TOGGLE_SETTING:
            newState = {
                ...state,
            };

            newState[action.payload.key] = action.payload.value;

            return newState;
        default:
            return state;
    }
}
