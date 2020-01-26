import { Alert } from 'react-native';
import { FOREGROUND, BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';
import { INITIALIZE_SETTINGS } from './settings';
import { INITIALIZE_STATISTICS } from './statistics';
import { INITIALIZE_CHARACTER, SAVE_CACHED_CHARACTER } from './character';
import { INITIALIZE_RANDOM_HERO } from './randomHero';
import { persistence } from '../lib/Persistence';

export default function appState(state = '', action) {
    switch (action.type) {
        case FOREGROUND:
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
            })

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
