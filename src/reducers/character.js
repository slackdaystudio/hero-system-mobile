import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { heroDesignerCharacter } from '../lib/HeroDesignerCharacter';

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

export const GET_CHARACTER = 'GET_CHARACTER';

export const SET_CHARACTER = 'SET_CHARACTER';

export const INITIALIZE_CHARACTER = 'INITIALIZE_CHARACTER';

export const SET_SHOW_SECONDARY = 'SET_SHOW_SECONDARY';

export const CLEAR_CHARACTER = 'CLEAR_CHARACTER';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setCharacter(character) {
    return async (dispatch) => {
        persistence.setCharacter(character).then(char => {
            dispatch({
                type: SET_CHARACTER,
                payload: char,
            });
        });
    };
}

export function initializeCharacter() {
    return async (dispatch) => {
        persistence.getCharacter().then(char => {
            dispatch({
                type: INITIALIZE_CHARACTER,
                payload: char,
            });
        });
    };
}

export function setShowSecondary(show) {
    return async (dispatch) => {
        persistence.setShowSecondaryCharacteristics(show).then(value => {
            dispatch({
                type: SET_SHOW_SECONDARY,
                payload: value,
            });
        });
    };
}

export function clearCharacter() {
    return async (dispatch) => {
        persistence.clearCharacter().then(() => {
            dispatch({
                type: CLEAR_CHARACTER,
                payload: null,
            });
        });
    };
}

let characterState = {
    character: null,
    showSecondary: true,
};

export default function character(state = characterState, action) {
    let newState = null;

    switch (action.type) {
    case SET_CHARACTER:
        newState = {
            ...state,
            character: {
                ...state.character,
            },
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
                ...state.character,
            },
        };
        newState.character = action.payload;

        return newState;
    case SET_SHOW_SECONDARY:
        newState = {
            ...state,
            showSecondary: {
                ...state.showSecondary,
            },
        };
        newState.showSecondary = action.payload;

        return newState;
    case CLEAR_CHARACTER:
        newState = {
            ...state,
            character: {
                ...state.character,
            },
        };

        newState.character = null;

        return newState;
    default:
        return state;
    }
}
