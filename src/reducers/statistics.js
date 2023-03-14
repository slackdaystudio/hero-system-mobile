import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {persistence} from '../lib/Persistence';
import {statistics as libStatistics} from '../lib/Statistics';

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

export const initializeStatistics = createAsyncThunk('statistic/initializeStatistics', async () => {
    return await persistence.initializeStatistics();
});

export const addStatistics = createAsyncThunk('statistic/addStatistics', async ({statistics}) => {
    return await libStatistics.add(statistics);
});

export const toggleSetting = createAsyncThunk('statistic/toggleSetting', async ({key, value}) => {
    return await persistence.toggleSetting(key, value);
});

const statisticsSlice = createSlice({
    name: 'statistic',
    initialState: {},
    reducers: {
        initializeStatistics: (state, action) => {
            const {statistics} = action.payload;

            state = {...statistics};
        },
        addStatistics: (state, action) => {
            const {statistics} = action.payload.statistics;

            libStatistics.add(statistics).then((stats) => {});
        },
        toggleSetting: (state, action) => {
            const {key, value} = action.payload;

            persistence.toggleSetting(key, value).then((settingValue) => {
                state[key] = settingValue;
            });
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeStatistics.fulfilled, (state, action) => {
                const {statistics} = action.payload;

                state = {...statistics};
            })
            .addCase(addStatistics.fulfilled, (state, action) => {
                console.log('Logged die roll statistics.');
            })
            .addCase(toggleSetting.fulfilled, (state, action) => {
                const settings = {...action.payload};

                state.useFifthEdition = settings.useFifthEdition;
                state.playSounds = settings.playSounds;
                state.onlyDiceSounds = settings.onlyDiceSounds;
            });
    },
});

// export const {} = statisticsSlice.actions;

export default statisticsSlice.reducer;
