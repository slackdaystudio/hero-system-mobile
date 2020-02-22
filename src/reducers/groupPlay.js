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

const MAX_MESSAGES = 200;

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const SET_MODE = 'SET_MODE';

export const REGISTER_GROUPPLAY_SOCKET = 'REGISTER_GROUPPLAY_SOCKET';

export const CLAIM_GROUPPLAY_SOCKET = 'CLAIM_GROUPPLAY_SOCKET';

export const UNREGISTER_GROUPPLAY_USER = 'UNREGISTER_GROUPPLAY_USER';

export const SET_GM = 'SET_GM';

export const UPDATE_USERNAME = 'UPDATE_USERNAME';

export const UPDATE_IP = 'UPDATE_IP';

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

export function registerGroupPlaySocket(id, socket) {
    return {
        type: REGISTER_GROUPPLAY_SOCKET,
        payload: {
            id: id,
            socket: socket,
        },
    };
}

export function claimGroupPlaySocket(username, id) {
    return {
        type: CLAIM_GROUPPLAY_SOCKET,
        payload: {
            username: username,
            id: id,
        },
    };
}

export function unregisterGroupPlayUser(id) {
    return {
        type: UNREGISTER_GROUPPLAY_USER,
        payload: id,
    };
}

export function setGm(username) {
    return {
        type: SET_GM,
        payload: username,
    };
}

export function updateUsername(username) {
    return {
        type: UPDATE_USERNAME,
        payload: username,
    };
}

export function updateIp(ip) {
    return {
        type: UPDATE_IP,
        payload: ip,
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
    gm: null,
    username: null,
    ip: null,
    messages: [],
    connectedUsers: [],
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
        case REGISTER_GROUPPLAY_SOCKET:
            newState = {
                ...state,
                connectedUsers: [
                    ...state.connectedUsers
                ]
            };

            newState.connectedUsers.push({
                id: action.payload.id,
                username: null,
                socket: action.payload.socket
            });

            return newState;
        case CLAIM_GROUPPLAY_SOCKET:
            newState = {
                ...state,
                connectedUsers: [
                    ...state.connectedUsers
                ]
            };

            for (let connectedUser of newState.connectedUsers) {
                if (connectedUser.id === action.payload.id) {
                    connectedUser.username = action.payload.username;
                    break;
                }
            }

            return newState;
        case UNREGISTER_GROUPPLAY_USER:
            newState = {
                ...state,
                connectedUsers: [
                    ...state.connectedUsers
                ]
            };

            let deleteIndex = -1;

            for (let i = 0; i < newState.connectedUsers.length; i++) {
                if (newState.connectedUsers[i].id === action.payload) {
                    newState.connectedUsers[i].socket.destroy();

                    deleteIndex = i;

                    break;
                }
            }

            if (deleteIndex >= 0) {
                newState.connectedUsers.splice(deleteIndex, 1);
            }

            return newState;
        case SET_GM:
            newState = {
                ...state,
            };

            newState.gm = action.payload;

            return newState;
        case UPDATE_USERNAME:
            newState = {
                ...state,
            };

            newState.username = action.payload;

            return newState;
        case UPDATE_IP:
            newState = {
                ...state,
            };

            newState.ip = action.payload;

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
