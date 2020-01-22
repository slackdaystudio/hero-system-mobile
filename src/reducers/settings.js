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

export const INITIALIZE_SETTINGS = 'INITIALIZE_SETTINGS';

export const CLEAR_SETTINGS = 'CLEAR_SETTINGS';

export const TOGGLE_SETTING = 'TOGGLE_SETTING';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeApplicationSettings() {
    return async (dispatch) => {
        persistence.initializeApplicationSettings().then(settings => {
            dispatch({
                type: INITIALIZE_SETTINGS,
                payload: settings,
            });
        });
    };
}

export function clearApplicationSettings() {
    return async (dispatch) => {
        persistence.clearApplicationSettings().then(settings => {
            dispatch({
                type: CLEAR_SETTINGS,
                payload: settings,
            });
        });
    };
}

export function toggleSetting(key, value) {
    return async (dispatch) => {
        persistence.toggleSetting(key, value).then(settingValue => {
            dispatch({
                type: TOGGLE_SETTING,
                payload: {
                    key: key,
                    value: settingValue,
                },
            });
        });
    };
}

let settingsState = {};

export default function settings(state = settingsState, action) {
    let newState = null;

    switch (action.type) {
        case INITIALIZE_SETTINGS:
        case CLEAR_SETTINGS:
            newState = {
                ...state,
            };

            newState.useFifthEdition = action.payload.useFifthEdition;
            newState.playSounds = action.payload.playSounds;

            return newState;
        case TOGGLE_SETTING:
            newState = {
                ...state
            };

            newState[action.payload.key] = action.payload.value;
            
            return newState;
        default:
            return state;
    }
}
