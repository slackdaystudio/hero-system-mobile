import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {persistence} from '../lib/Persistence';
import {MAX_CHARACTER_SLOTS} from '../lib/Character';

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

export const setCharacter = createAsyncThunk('character/setCharacter', async ({character, slot}) => {
    return await persistence.saveCharacter(character, slot);
});

export const clearCharacter = createAsyncThunk('character/clearCharacter', async ({filename, character, characters, saveCharacter}) => {
    return await persistence.clearCharacter(filename, character, characters, saveCharacter);
});

export const clearAllCharacters = createAsyncThunk('character/clearAllCharacters', async () => {
    return await persistence.clearCharacterData();
});

export const updateLoadedCharacters = createAsyncThunk('character/updateLoadedCharacters', async ({newCharacter, character, characters}) => {
    return await persistence.updateLoadedCharacters(newCharacter, character, characters);
});

export const saveCachedCharacter = createAsyncThunk('character/saveCachedCharacter', async ({character, characters}) => {
    return await persistence.saveCharacterData(character, characters);
});

const characterSlice = createSlice({
    name: 'character',
    initialState: {
        character: null,
        characters: [],
    },
    reducers: {
        initializeCharacter: (state, action) => {
            if (action.payload === null) {
                state.character = null;
                state.characters = [];
            } else {
                state.character = {...action.payload.character};
                state.characters = {...action.payload.characters};
            }
        },
        setShowSecondary: (state, action) => {
            state.character.showSecondary = action.payload.showSecondary;
        },
        selectCharacter: (state, action) => {
            for (const [k, v] of Object.entries(state.characters)) {
                if (v !== null && v.filename === state.character.filename) {
                    state.characters[k] = {...state.character};
                    break;
                }
            }

            state.character = {...action.payload.character};
        },
        setCombatDetails: (state, action) => {
            state.character.combatDetails = action.payload.combatDetails;
        },
        setSparseCombatDetails: (state, action) => {
            const combatDetailsKey = action.payload.secondary ? 'secondary' : 'primary';

            for (const [key, value] of Object.entries(action.payload.sparseCombatDetails)) {
                if (state.character.combatDetails[combatDetailsKey].hasOwnProperty(key)) {
                    state.character.combatDetails[combatDetailsKey][key] = value;
                }
            }
        },
        usePhase: (state, action) => {
            const detailsKey = action.payload.secondary ? 'secondary' : 'primary';
            let used = state.character.combatDetails[detailsKey].phases[action.payload.phase.toString()].used;
            let aborted = state.character.combatDetails[detailsKey].phases[action.payload.phase.toString()].aborted;

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

            state.character.combatDetails[detailsKey].phases[action.payload.phase.toString()] = {used, aborted};
        },
        updateNotes: (state, action) => {
            state.character.notes = action.payload.notes;
        },
        applyStatus: (state, action) => {
            const {status} = action.payload;
            const combatDetailsKey = state.character.showSecondary ? 'secondary' : 'primary';
            const apply = (char) => {
                if (char.combatDetails[combatDetailsKey].hasOwnProperty('statuses')) {
                    if (status.index === -1) {
                        char.combatDetails[combatDetailsKey].statuses.push(status);
                    } else {
                        char.combatDetails[combatDetailsKey].statuses[status.index] = status;
                    }
                } else {
                    char.combatDetails[combatDetailsKey].statuses = [status];
                }
            };

            apply(state.character);

            for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
                if (state.characters[i.toString()] !== null && state.characters[i.toString()].filename === state.character.filename) {
                    apply(state.characters[i.toString()], status);
                    break;
                }
            }
        },
        clearStatus: (state, action) => {
            const {index} = action.payload;
            const combatDetailsKey = state.character.showSecondary ? 'secondary' : 'primary';
            const clear = (char) => {
                if (char.combatDetails[combatDetailsKey].statuses.length >= index) {
                    char.combatDetails[combatDetailsKey].statuses.splice(index, 1);
                }
            };

            clear(state.character);

            for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
                if (state.characters[i.toString()] !== null && state.characters[i.toString()].filename === state.character.filename) {
                    clear(state.characters[i.toString()]);
                    break;
                }
            }
        },
        clearAllStatuses: (state, action) => {
            const combatDetailsKey = state.character.showSecondary ? 'secondary' : 'primary';

            state.character.combatDetails[combatDetailsKey].statuses = [];

            for (let i = 0; i < MAX_CHARACTER_SLOTS; i++) {
                if (state.characters[i.toString()] !== null && state.characters[i.toString()].filename === state.character.filename) {
                    state.combatDetails.clearAllStatuses(state.characters[i.toString()]);
                    break;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(setCharacter.fulfilled, (state, action) => {
                state.character = {...action.payload.character};
                state.characters = {...action.payload.characters};
            })
            .addCase(clearCharacter.fulfilled, (state, action) => {
                state.character = {...action.payload.character};
                state.characters = {...action.payload.characters};
            })
            .addCase(clearAllCharacters.fulfilled, (state, _action) => {
                state.character = null;
                state.characters = {};
            })
            .addCase(updateLoadedCharacters.fulfilled, (state, action) => {
                state.character = {...action.payload.character};
                state.characters = {...action.payload.characters};
            })
            .addCase(saveCachedCharacter.fulfilled, (_state, _action) => {
                console.log('Saved cached characters');
            });
    },
});

export const {
    initializeCharacter,
    setShowSecondary,
    selectCharacter,
    setCombatDetails,
    setSparseCombatDetails,
    usePhase,
    updateNotes,
    applyStatus,
    clearStatus,
    clearAllStatuses,
} = characterSlice.actions;

export default characterSlice.reducer;
