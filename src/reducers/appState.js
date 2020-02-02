import { Alert } from 'react-native';
import { FOREGROUND, BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';
import { INITIALIZE_SETTINGS } from './settings';
import { INITIALIZE_STATISTICS } from './statistics';
import { INITIALIZE_CHARACTER, SAVE_CACHED_CHARACTER } from './character';
import { INITIALIZE_RANDOM_HERO } from './randomHero';
import { INITIALIZE_VERSION } from './version';
import { persistence } from '../lib/Persistence';
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

function init(action) {
    persistence.initializeApplication().then((appSettings) => {
        action.asyncDispatch({
            type: INITIALIZE_SETTINGS,
            payload: appSettings.settings,
        });

        action.asyncDispatch({
            type: INITIALIZE_STATISTICS,
            payload: appSettings.statistics,
        });

        action.asyncDispatch({
            type: INITIALIZE_CHARACTER,
            payload: appSettings.character,
        });

        action.asyncDispatch({
            type: INITIALIZE_RANDOM_HERO,
            payload: appSettings.randomHero,
        });

        action.asyncDispatch({
            type: INITIALIZE_VERSION,
            payload: currentVersion.current,
        });
    });
}

export default function appState(state = '', action) {
    switch (action.type) {
        case FOREGROUND:
            persistence.getVersion().then((version) => {
                if (version === null) {
                    persistence.setVersion(currentVersion.current).then(() => {
                        persistence.clearCaches().then(() => {
                            init(action);
                        });
                    });
                } else if (version !== currentVersion.current) {
                    persistence.setVersion(currentVersion.current).then(() => {
                        if (currentVersion.onFirstLoad === 'flush') {
                            persistence.clearCaches().then(() => {
                                init(action);
                            });
                        } else {
                            init(action);
                        }
                    });
                } else {
                    init(action);
                }
            });

            return state;
        case BACKGROUND:
        case INACTIVE:
            action.asyncDispatch({
                type: SAVE_CACHED_CHARACTER,
                payload: null,
            });

            return state;
        default:
            return state
    }
}
