import { persistence } from '../lib/Persistence';

// Copyright 2018-Present Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
                payload: randomHero,
            });
        });
    };
}

export function setRandomHero(randomHero) {
    return async (dispatch) => {
        persistence.setRandomHero(randomHero).then((randomHero) => {
            dispatch({
                type: SET_RANDOM_HERO,
                payload: randomHero,
            });
        });
    };
}

export function setRandomHeroName(name) {
    return async (dispatch) => {
        persistence.setRandomHeroName(name).then((randomHero) => {
            dispatch({
                type: SET_RANDOM_HERO_NAME,
                payload: randomHero,
            });
        });
    };
}

export function clearRandomHero() {
    return async (dispatch) => {
        persistence.clearRandomHero().then(() => {
            dispatch({
                type: CLEAR_HERO,
                payload: null,
            });
        });
    };
}

let heroState = {
    hero: null,
};

export default function randomHero(state = heroState, action) {
    let newState = null;

    switch (action.type) {
        case INITIALIZE_RANDOM_HERO:
        case SET_RANDOM_HERO:
        case SET_RANDOM_HERO_NAME:
        case CLEAR_HERO:
            newState = {
                ...state,
                hero: {
                    ...state.hero,
                },
            };

            newState.hero = action.payload;

            return newState;
        default:
            return state;
    }
}
