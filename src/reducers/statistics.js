import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {DEFAULT_STATS, persistence} from '../lib/Persistence';
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

export const addStatistics = createAsyncThunk('statistics/addStatistics', async ({statistics}) => {
    return await libStatistics.add(statistics);
});

export const clearStatistics = createAsyncThunk('statistics/clearStatistics', async () => {
    return await persistence.clearStatistics();
});

const statisticsSlice = createSlice({
    name: 'statistics',
    initialState: DEFAULT_STATS,
    reducers: {
        initializeStatistics: (state, action) => {
            const {statistics} = action.payload;

            state = statistics;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addStatistics.fulfilled, (state, action) => {
                state = action.payload;
            })
            .addCase(clearStatistics.fulfilled, (_state, _action) => {
                console.log('Cleared and reset statistics.');
            });
    },
});

export const {initializeStatistics} = statisticsSlice.actions;

export default statisticsSlice.reducer;
