import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {persistence} from '../lib/Persistence';
import {randomCharacter} from '../lib/RandomCharacter';

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

export const setRandomHero = createAsyncThunk('randomHero/setRandomHero', async ({randomHero}) => {
    return await persistence.setRandomHero(randomHero);
});

export const setRandomHeroName = createAsyncThunk('randomHero/setRandomHeroName', async ({name}) => {
    return await persistence.setRandomHeroName(name);
});

export const clearRandomHero = createAsyncThunk('randomHero/clearRandomHero', async () => {
    await persistence.clearRandomHero();

    return null;
});

const randomHeroSlice = createSlice({
    name: 'randomHero',
    initialState: {},
    reducers: {
        initializeRandomHero: (state, action) => {
            const {randomHero} = action.payload;

            state.hero = randomHero;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(setRandomHero.fulfilled, (state, action) => {
                const {randomHero} = action.payload;

                state.hero = randomHero;
            })
            .addCase(setRandomHeroName.fulfilled, (state, action) => {
                const {randomHero} = action.payload;

                state.hero = randomHero;
            })
            .addCase(clearRandomHero.fulfilled, (state, action) => {
                state.hero = randomCharacter.generate();
            });
    },
});

export const {initializeRandomHero} = randomHeroSlice.actions;

export default randomHeroSlice.reducer;
