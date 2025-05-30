import {createSlice} from '@reduxjs/toolkit';
import {initializeApplicationSettings} from './settings';
import {initializeStatistics} from './statistics';
import {initializeCharacter} from './character';
import {initializeRandomHero} from './randomHero';
import {initializeVersion} from './version';
import {persistence} from '../lib/Persistence';
import currentVersion from '../../public/version.json';

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

export const initialize = (db) => {
    return async (dispatch) => {
        const appSettings = await persistence.initializeApplication(db);

        dispatch(initializeApplicationSettings({settings: appSettings.settings}));

        dispatch(initializeStatistics({statistics: appSettings.statistics}));

        dispatch(initializeCharacter({character: appSettings.character.character, characters: appSettings.character.characters}));

        dispatch(initializeRandomHero({randomHero: appSettings.randomHero}));

        dispatch(initializeVersion({version: currentVersion.current}));
    };
};

const appStateSlice = createSlice({
    name: 'appState',
    initialState: null,
});

export default appStateSlice.reducer;
