import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';
import { PLAYER_OPTION_ALL } from '../groupPlay/GroupPlayServer';

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

export const SET_CLIENT = 'SET_CLIENT';

export const SET_SERVER = 'SET_SERVER';

export const SET_ACTIVE_PLAYER = 'SET_ACTIVE_PLAYER';

export const RECEIVE_MESSAGE = 'RECEIVE_MESSAGE';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setClient(client) {
    return {
        type: SET_CLIENT,
        payload: client,
    };
}

export function setServer(server) {
    return {
        type: SET_SERVER,
        payload: server,
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
    client: null,
    server: null,
    activePlayer: false,
    messages: [],
    maxMessages: 200
};

export default function groupPlay(state = groupPlayState, action) {
    let newState = null;

    switch (action.type) {
        case SET_CLIENT:
            newState = {
                ...state,
                messages: [
                    ...state.messages
                ]
            };

            newState.client = action.payload;

            return newState;
        case SET_SERVER:
            newState = {
                ...state,
                messages: [
                    ...state.messages
                ]
            };

            newState.server = action.payload;

            return newState;
        case SET_ACTIVE_PLAYER:
            newState = {
                ...state,
                messages: [
                    ...state.messages
                ]
            };

            newState.activePlayer = false;

            // Cannot do a deep or shallow copy on state client/server
            if (state.client !== null && typeof state.client === 'object') {
                newState.activePlayer = state.client.isActivePlayer();
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
