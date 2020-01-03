import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const INITIALIZE_STATISTICS = 'INITIALIZE_STATISTICS';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeStatistics() {
    return async (dispatch) => {
        persistence.initializeStatistics().then(stats => {
            dispatch({
                type: INITIALIZE_STATISTICS,
                payload: stats
            });
        });
    };
}

initialState = {};

export default function statistics(state = initialState, action) {
    let newState = null

    switch (action.type) {
        case INITIALIZE_STATISTICS:
            newState = {...state};
            newState = action.payload;

            return newState;
        default:
            return state;
    }
}
