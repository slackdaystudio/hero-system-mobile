import { persistence, MAX_CHARACTER_SLOTS } from '../lib/Persistence';

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

export const SET_CHARACTER = 'SET_CHARACTER';

export const UPDATE_LOADED_CHARACTERS = 'UPDATE_LOADED_CHARACTERS';

export const INITIALIZE_CHARACTER = 'INITIALIZE_CHARACTER';

export const SAVE_CACHED_CHARACTER = 'SAVE_CACHED_CHARACTER';

export const SET_SHOW_SECONDARY = 'SET_SHOW_SECONDARY';

export const CLEAR_CHARACTER = 'CLEAR_CHARACTER';

export const CLEAR_CHARACTER_DATA = 'CLEAR_CHARACTER_DATA';

export const SELECT_CHARACTER = 'SELECT_CHARACTER';

export const SET_COMBAT_DETAILS = 'SET_COMBAT_DETAILS';

export const SET_SPARSE_COMBAT_DETAILS = 'SET_SPARSE_COMBAT_DETAILS';

export const USE_PHASE = 'USE_PHASE';

export const UPDATE_NOTES = 'UPDATE_NOTES';

export const APPLY_STATUS = 'APPLY_STATUS';

export const CLEAR_ALL_STATUSES = 'CLEAR_ALL_STATUSES';

export const CLEAR_STATUS = 'CLEAR_STATUS';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setCharacter(character, slot) {
    return async (dispatch) => {
        persistence.saveCharacter(character, slot).then(characterData => {
            dispatch({
                type: SET_CHARACTER,
                payload: characterData,
            });
        });
    };
}

export function updateLoadedCharacters(newCharacter, character, characters) {
    return async (dispatch) => {
        persistence.updateLoadedCharacters(newCharacter, character, characters).then(characterData => {
            dispatch({
                type: UPDATE_LOADED_CHARACTERS,
                payload: characterData,
            });
        });
    };
}

export function setShowSecondary(showSecondary) {
    return {
        type: SET_SHOW_SECONDARY,
        payload: showSecondary,
    };
}

export function clearCharacter(filename, character, characters, saveCharacter) {
    return async (dispatch) => {
        persistence.clearCharacter(filename, character, characters, saveCharacter).then((characterData) => {
            dispatch({
                type: CLEAR_CHARACTER,
                payload: characterData,
            });
        });
    };
}

export function clearCharacterData() {
    return async (dispatch) => {
        persistence.clearCharacterData().then(() => {
            dispatch({
                type: CLEAR_CHARACTER_DATA,
                payload: null,
            });
        });
    };
}

export function selectCharacter(character) {
    return {
        type: SELECT_CHARACTER,
        payload: character,
    };
}

export function setCombatDetails(character) {
    return {
        type: SET_COMBAT_DETAILS,
        payload: character,
    };
}

export function setSparseCombatDetails(sparseCombatDetails, secondary) {
    return {
        type: SET_SPARSE_COMBAT_DETAILS,
        payload: {
            secondary: secondary,
            sparseCombatDetails: sparseCombatDetails,
        },
    };
}

export function usePhase(phase, secondary, abort = false) {
    return {
        type: USE_PHASE,
        payload: {
            phase: phase,
            secondary: secondary,
            abort: abort,
        },
    };
}

export function updateNotes(notes) {
    return {
        type: UPDATE_NOTES,
        payload: notes,
    };
}

export function applyStatus(character, characters, status) {
    return async (dispatch) => {
        persistence.applyStatus(character, characters, status).then((characterData) => {
            dispatch({
                type: APPLY_STATUS,
                payload: characterData,
            });
        });
    };
}

export function clearAllStatuses(character, characters) {
    return async (dispatch) => {
        persistence.clearAllStatuses(character, characters).then((characterData) => {
            dispatch({
                type: CLEAR_ALL_STATUSES,
                payload: characterData,
            });
        });
    };
}

export function clearStatus(character, characters, index) {
    return async (dispatch) => {
        persistence.clearStatus(character, characters, index).then((characterData) => {
            dispatch({
                type: CLEAR_STATUS,
                payload: characterData,
            });
        });
    };
}

let characterState = {
    character: null,
    characters: [],
};

export default function character(state = characterState, action) {
    let newState = null;

    switch (action.type) {
        case SET_CHARACTER:
        case CLEAR_CHARACTER:
        case UPDATE_LOADED_CHARACTERS:
        case APPLY_STATUS:
        case CLEAR_ALL_STATUSES:
        case CLEAR_STATUS:
            newState = {
                ...state,
                character: {
                    ...state.character,
                },
                characters: {
                    ...state.characters,
                },
            };

            newState.character = {...action.payload.character};
            newState.characters = {...action.payload.characters};

            return newState;
        case INITIALIZE_CHARACTER:
            if (action.payload === null) {
                return state;
            }

            newState = {
                ...action.payload,
                character: {
                    ...action.payload.character,
                },
                characters: {
                    ...action.payload.characters,
                },
            };

            return newState;
        case SAVE_CACHED_CHARACTER:
            persistence.saveCharacterData(state.character, state.characters).then(() => {
                console.log('Saved cached characters');
            });

            return state;
        case SET_SHOW_SECONDARY:
            newState = {
                ...state,
                character: {
                    ...state.character,
                },
            };

            newState.character.showSecondary = action.payload;

            return newState;
        case CLEAR_CHARACTER_DATA:
            newState = {
                ...state,
                character: {
                    ...state.character,
                },
                characters: {
                    ...state.characters,
                },
            };

            newState.character = null;
            newState.characters = {};

            for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
                newState.characters[i.toString()] = null;
            }

            return newState;
        case SELECT_CHARACTER:
            newState = {
                ...state,
                character: {
                    ...state.character,
                },
                characters: {
                    ...state.characters,
                },
            };

            for (let [k, v] of Object.entries(newState.characters)) {
                if (v !== null && v.filename === newState.character.filename) {
                    newState.characters[k] = {...newState.character};
                    break;
                }
            }

            newState.character = {...action.payload};

            return newState;
        case SET_COMBAT_DETAILS:
            newState = {
                ...state,
                character: {
                    ...state.character,
                    combatDetails: {
                        ...state.character.combatDetails,
                    },
                },
            };

            newState.character.combatDetails = action.payload;

            return newState;
        case SET_SPARSE_COMBAT_DETAILS:
            newState = {
                ...state,
                character: {
                    ...state.character,
                    combatDetails: {
                        ...state.character.combatDetails,
                    },
                },
            };

            let combatDetailsKey = action.payload.secondary ? 'secondary' : 'primary';

            for (let [key, value] of Object.entries(action.payload.sparseCombatDetails)) {
                if (newState.character.combatDetails[combatDetailsKey].hasOwnProperty(key)) {
                    newState.character.combatDetails[combatDetailsKey][key] = value;
                }
            }

            return newState;
        case USE_PHASE:
            newState = {
                ...state,
                character: {
                    ...state.character,
                    combatDetails: {
                        ...state.character.combatDetails,
                    },
                },
            };

            let detailsKey = action.payload.secondary ? 'secondary' : 'primary';
            let used = newState.character.combatDetails[detailsKey].phases[action.payload.phase.toString()].used;
            let aborted = newState.character.combatDetails[detailsKey].phases[action.payload.phase.toString()].aborted;

            if (action.payload.abort) {
                used = false;
                aborted = !aborted;
            } else {
                if (aborted) {
                    used = false;
                    aborted = false;
                } else {
                    used = !used;
                    aborted = false;
                }
            }

            newState.character.combatDetails[detailsKey].phases[action.payload.phase.toString()] = {
                used: used,
                aborted: aborted,
            };

            return newState;
        case UPDATE_NOTES:
            newState = {
                ...state,
                character: {
                    ...state.character,
                },
            };

            newState.character.notes = action.payload;

            return newState;
        default:
            return state;
    }
}
