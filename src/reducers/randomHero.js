import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const INITIALIZE_RANDOM_HERO = 'INITIALIZE_RANDOM_HERO';

export const SET_RANDOM_HERO = 'SET_RANDOM_HERO';

export const SET_RANDOM_HERO_NAME = 'SET_RANDOM_HERO_NAME';

export const CLEAR_HERO = 'CLEAR_HERO';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeRandomHero() {
    return async (dispatch) => {
        persistence.initializeRandomHero().then((randomHero) => {
            dispatch({
                type: INITIALIZE_RANDOM_HERO,
                payload: randomHero
            });
        });
    };
}

export function setRandomHero(randomHero) {
    return async (dispatch) => {
        persistence.setRandomHero(randomHero).then((character) => {
            dispatch({
                type: SET_RANDOM_HERO,
                payload: character
            });
        });
    };
}

export function setRandomHeroName(name) {
    return async (dispatch) => {
        persistence.setRandomHeroName(name).then((character) => {
            dispatch({
                type: SET_RANDOM_HERO_NAME,
                payload: character
            });
        });
    };
}

export function clearRandomHero() {
    return async (dispatch) => {
        persistence.clearRandomHero().then(() => {
            dispatch({
                type: CLEAR_HERO,
                payload: null
            });
        });
    };
}

initialState = {
    character: null
};

export default function randomHero(state = initialState, action) {
    let newState = null

    switch (action.type) {
        case INITIALIZE_RANDOM_HERO:
        case SET_RANDOM_HERO:
        case SET_RANDOM_HERO_NAME:
        case CLEAR_HERO:
            newState = {
                ...state,
                character: {
                    ...state.character
                }
            };

            newState.character = action.payload;

            return newState;
        default:
            return state;
    }
}
