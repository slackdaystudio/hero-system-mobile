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

export const INITIALIZE_COMBAT_DETAILS = 'INITIALIZE_COMBAT_DETAILS';

export const SET_COMBAT_DETAILS = 'SET_COMBAT_DETAILS';

export const SET_SPARSE_COMBAT_DETAILS = 'SET_SPARSE_COMBAT_DETAILS';

export const USE_PHASE = 'USE_PHASE';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeCombatDetails(character) {
    return async (dispatch) => {
        persistence.initializeCombatDetails(character).then(combatDetails => {
            dispatch({
                type: INITIALIZE_COMBAT_DETAILS,
                payload: combatDetails,
            });
        });
    };
}

export function setCombatDetails(character) {
    return async (dispatch) => {
        persistence.setCombatDetails(character).then(combatDetails => {
            dispatch({
                type: SET_COMBAT_DETAILS,
                payload: combatDetails,
            });
        });
    };
}

export function setSparseCombatDetails(sparseCombatDetails) {
    return async (dispatch) => {
        persistence.setSparseCombatDetails(sparseCombatDetails).then(combatDetails => {
            dispatch({
                type: SET_SPARSE_COMBAT_DETAILS,
                payload: combatDetails,
            });
        });
    };
}

export function usePhase(phase, abort = false) {
    return async (dispatch) => {
        persistence.usePhase(phase, abort).then(combatDetails => {
            dispatch({
                type: USE_PHASE,
                payload: combatDetails,
            });
        });
    };
}

let combatState = {};

export default function combat(state = combatState, action) {
    let newState = null;

    switch (action.type) {
        case INITIALIZE_COMBAT_DETAILS:
        case SET_COMBAT_DETAILS:
        case SET_SPARSE_COMBAT_DETAILS:
        case USE_PHASE:
            newState = {...state};
            newState = action.payload;

            return newState;
        default:
            return state;
    }
}
