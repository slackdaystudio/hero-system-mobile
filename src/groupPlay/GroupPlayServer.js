import '../../shim';
import { NetworkInfo } from 'react-native-network-info';
import uuidv4 from 'uuid/v4';
import { common } from '../lib/Common';

var net = require('react-native-tcp');

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

export const GROUPPLAY_PORT = 49155;

export const COMMAND_DISCONNECT = 0;

export const COMMAND_ACTIVE_PLAYER = 1;

export const COMMAND_SET_GM = 2

export const COMMAND_END_GAME = 3;

export const COMMAND_CLAIM_SOCKET = 4;

export const TYPE_GROUPPLAY_COMMAND = 0;

export const TYPE_GROUPPLAY_MESSAGE = 1;

export const PLAYER_OPTION_ALL = 'All';

export default class GroupPlayServer {
    constructor(username, receiveMessage, setServer) {
        this.server = null;
        this.username = username;
        this.activePlayer = PLAYER_OPTION_ALL;
        this.connectedUsers = [];
        this.receiveMessage = receiveMessage;
        this.setServer = setServer;

        this._create();
    }

    setActivePlayer(activePlayer) {
        this.activePlayer = activePlayer;
        
        for (const user of this.connectedUsers) {
            user.socket.write(JSON.stringify({
                sender: this.username,
                type: TYPE_GROUPPLAY_COMMAND,
                command: COMMAND_ACTIVE_PLAYER,
                username: activePlayer
            }));
        }
    }

    sendMessage(message, recipient) {
        for (const user of this.connectedUsers) {
            if (user.username === recipient || recipient === PLAYER_OPTION_ALL) {
                user.socket.write(JSON.stringify({
                    sender: this.username,
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: message
                }));
            }
        }
    }

    stopGame(onClose) {
        for (const user of this.connectedUsers) {
            user.socket.write(JSON.stringify({
                sender: this.username,
                type: TYPE_GROUPPLAY_COMMAND,
                command: COMMAND_END_GAME
            }), 'utf8', () => {
                this._unregisterGroupPlayUser(user.id);
            });
        }

        this.server.close(() => {
            this.server.unref();

            this.receiveMessage(JSON.stringify({
                sender: 'Server',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: 'Your game session has ended.'
            }));

            this.setServer(null);

            onClose();
        });
    }

    _create() {
        NetworkInfo.getIPV4Address().then(ipv4Address => {
            if (ipv4Address === null) {
                common.toast('Unable to determine IP address');
                return;
            }

            this.server = net.createServer((socket) => {
                let socketId = uuidv4();

                this._registerGroupPlaySocket(socketId, socket);

                socket.on('data', (data) => {
                    this._processMessage(data, socketId, socket);
                });

                socket.on('error', (error) => {
                    this.receiveMessage(JSON.stringify({
                        sender: 'Server',
                        type: TYPE_GROUPPLAY_MESSAGE,
                        message: `${error}`
                    }));
                });

                socket.on('close', (error) => {
                    this.receiveMessage(JSON.stringify({
                        sender: 'Server',
                        type: TYPE_GROUPPLAY_MESSAGE,
                        message: `A player has left your game${error ? ` (${error})` : ''}`
                    }));

                    this._unregisterGroupPlayUser(socketId);
                });

                this.receiveMessage(JSON.stringify({
                    sender: 'Server',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: 'A new connection has been created'
                }));

                socket.write(JSON.stringify({
                    sender: this.username,
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: 'Welcome to my game session!'
                }));
            }).listen(GROUPPLAY_PORT, () => {
                this.receiveMessage(JSON.stringify({
                    sender: 'Server',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: `Your game session has started ask your players to connect to ${ipv4Address}`
                }));
            });

            this.server.on('error', (error) => {
                this.receiveMessage(JSON.stringify({
                    sender: 'Server',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: `${error}`
                }));
            });

            this.server.on('close', () => {
                console.log('Closing GroupPlay server');
            });
        });
    }

    _registerGroupPlaySocket(socketId, socket) {
        this.connectedUsers.push({
            id: socketId,
            username: null,
            socket: socket
        });
    }

    _processMessage(data, socketId, socket) {
        let json = JSON.parse(data);

        if (json.type === TYPE_GROUPPLAY_COMMAND) {
            switch (json.command) {
                case COMMAND_CLAIM_SOCKET:
                    this._claimGroupPlaySocket(json.sender, socketId);

                    socket.write(JSON.stringify({
                        sender: this.username,
                        type: TYPE_GROUPPLAY_COMMAND,
                        command: COMMAND_SET_GM
                    }));
                    break;
                case COMMAND_DISCONNECT:
                    this.receiveMessage(data);
                    this._unregisterGroupPlayUser(socketId);
                    break;
                default:
                    // do nothing
            }
        } else if (json.type === TYPE_GROUPPLAY_MESSAGE) {
            if (json.sender === this.activePlayer || this.activePlayer === PLAYER_OPTION_ALL) {
                this.receiveMessage(data);
            }
        }
    }

    _claimGroupPlaySocket(username, socketId) {
        for (const user of this.connectedUsers) {
            if (user.id === socketId) {
                user.username = username;
                break;
            }
        }
    }

    _unregisterGroupPlayUser(id) {
        let index = -1;

        for (let i = 0; i < this.connectedUsers.length; i++) {
            if (this.connectedUsers[i].id === id) {
                this.connectedUsers[i].socket.destroy();
                index = i;
                break;
            }
        }

        if (index >= 0) {
            this.connectedUsers.splice(index, 1);
        }
    }
}
