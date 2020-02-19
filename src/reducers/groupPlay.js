import { Alert } from 'react-native';
import { common } from '../lib/Common';
import { persistence } from '../lib/Persistence';

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

export const MODE_SERVER = 0;

export const MODE_CLIENT = 1;

const MAX_MESSAGES = 100;

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const SET_MODE = 'SET_MODE';

export const REGISTER_GROUPPLAY_USER = 'REGISTER_GROUPPLAY_USER';

export const UNREGISTER_GROUPPLAY_USER = 'UNREGISTER_GROUPPLAY_USER';

export const UPDATE_USERNAME = 'UPDATE_USERNAME';

export const SET_ACTIVE_PLAYER = 'SET_ACTIVE_PLAYER';

export const RECEIVE_MESSAGE = 'RECEIVE_MESSAGE';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function setMode(mode) {
    return {
        type: SET_MODE,
        payload: mode,
    };
}

export function registerGroupPlayUser(username, socket) {
    return {
        type: REGISTER_GROUPPLAY_USER,
        payload: {
            username: username,
            socket: socket,
        },
    };
}

export function unregisterGroupPlayUser(username) {
    return {
        type: UNREGISTER_GROUPPLAY_USER,
        payload: username,
    };
}

export function updateUsername(username) {
    return {
        type: UPDATE_USERNAME,
        payload: username,
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
    mode: null,
    username: null,
    messages: [],
    connectedUsers: new Map(),
    activePlayer: 'All',
};

export default function groupPlay(state = groupPlayState, action) {
    let newState = null;

    switch (action.type) {
        case SET_MODE:
            newState = {
                ...state,
            };

            newState.mode = action.payload;

            return newState;
        case REGISTER_GROUPPLAY_USER:
            newState = {
                ...state
            };

            newState.connectedUsers = new Map(state.connectedUsers);

            if (newState.connectedUsers.has(action.payload.username)) {
                newState.connectedUsers.get(action.payload.username).destroy();

                newState.connectedUsers.set(action.payload.username, action.payload.socket);
            } else {
                newState.connectedUsers.set(action.payload.username, action.payload.socket);
            }

            return newState;
        case UNREGISTER_GROUPPLAY_USER:
            newState = {
                ...state,
            };

            newState.connectedUsers = new Map(state.connectedUsers);

            if (newState.connectedUsers.has(action.payload)) {
                newState.connectedUsers.get(action.payload).destroy();

                newState.connectedUsers.delete(action.payload);
            }

            return newState;
        case UPDATE_USERNAME:
            newState = {
                ...state,
            };

            newState.username = action.payload;

            return newState;
        case SET_ACTIVE_PLAYER:
            newState = {
                ...state,
            };

            newState.activePlayer = action.payload;

            return newState;
        case RECEIVE_MESSAGE:
            newState = {
                ...state,
                messages: [
                    ...state.messages
                ]
            };

            if (newState.messages.length === MAX_MESSAGES) {
                newState.messages.splice(0, 1);
            }

            newState.messages.push(JSON.parse(action.payload));

            return newState;
        default:
            return state;
    }
}
