import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { statistics as libStatistics } from '../lib/Statistics';

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

export const INITIALIZE_STATISTICS = 'INITIALIZE_STATISTICS';

export const ADD_STATISTICS = 'ADD_STATISTICS';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeStatistics() {
    return async (dispatch) => {
        persistence.initializeStatistics().then(stats => {
            dispatch({
                type: INITIALIZE_STATISTICS,
                payload: stats,
            });
        });
    };
}

export function addStatistics(statistics) {
    return async (dispatch) => {
        libStatistics.add(statistics).then((stats) => {
            dispatch({
                type: ADD_STATISTICS,
                payload: stats,
            });
        });
    };
}

export function clearStatistics() {
    return async (dispatch) => {
        persistence.clearStatistics().then((stats) => {
            dispatch({
                type: INITIALIZE_STATISTICS,
                payload: stats,
            });
        });
    };
}

let statisticsState = {};

export default function statistics(state = statisticsState, action) {
    let newState = null;

    switch (action.type) {
        case INITIALIZE_STATISTICS:
        case ADD_STATISTICS:
            newState = {...state};
            newState = action.payload;

            return newState;
        default:
            return state;
    }
}
