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

const statisticsSlice = createSlice({
    name: 'statistic',
    initialState: {},
    reducers: null,
    extraReducers: (builder) => {
        builder
            .addCase(initializeStatistics.fulfilled, (state, action) => {
                const {statistics} = action.payload;

                state = {...statistics};
            })
            .addCase(addStatistics.fulfilled, (state, action) => {
                console.log('Logged die roll statistics.');
            });
    },
});

// export const {} = statisticsSlice.actions;

export default statisticsSlice.reducer;
