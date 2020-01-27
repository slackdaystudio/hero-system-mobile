import { Alert } from 'react-native';
import { FOREGROUND, BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';
import { INITIALIZE_SETTINGS } from './settings';
import { INITIALIZE_STATISTICS } from './statistics';
import { INITIALIZE_CHARACTER, SAVE_CACHED_CHARACTER } from './character';
import { INITIALIZE_RANDOM_HERO } from './randomHero';
import { INITIALIZE_VERSION } from './version';
import { persistence } from '../lib/Persistence';
import currentVersion from '../../public/version.json';

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
