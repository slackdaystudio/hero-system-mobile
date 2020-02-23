import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { PLAYER_OPTION_ALL } from '../groupPlay/GroupPlayServer';
import { groupPlayClient } from '../../App';

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

export const SET_GROUPPLAY_ACTIVE = 'SET_GROUPPLAY_ACTIVE';

export const SET_ACTIVE_PLAYER = 'SET_ACTIVE_PLAYER';

export const RECEIVE_MESSAGE = 'RECEIVE_MESSAGE';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setActive(active) {
    return {
        type: SET_GROUPPLAY_ACTIVE,
        payload: active,
    };
}

export function setActivePlayer(username) {
    return {
        type: SET_ACTIVE_PLAYER,
        payload: username,
    };
}


export function receiveMessage(message) {
    return {
        type: RECEIVE_MESSAGE,
        payload: message,
    };
}

let groupPlayState = {
    active: false,
    activePlayer: false,
    messages: [],
    maxMessages: 200
};

export default function groupPlay(state = groupPlayState, action) {
    let newState = null;

    switch (action.type) {
        case SET_GROUPPLAY_ACTIVE:
            newState = {
                ...state,
                messages: [
                    ...state.messages
                ]
            };

            newState.active = action.payload;

            return newState;
        case SET_ACTIVE_PLAYER:
            newState = {
                ...state,
                messages: [
                    ...state.messages
                ]
            };

            newState.activePlayer = false;

            if (groupPlayClient !== null && typeof groupPlayClient === 'object') {
                newState.activePlayer = groupPlayClient.isActivePlayer();
            }

            return newState;
        case RECEIVE_MESSAGE:
            newState = {
                ...state,
                messages: [
                    ...state.messages
                ]
            };

            if (newState.messages.length === newState.maxMessages) {
                newState.messages.splice(0, 1);
            }

            newState.messages.push(JSON.parse(action.payload));

            return newState;
        default:
            return state;
    }
}
