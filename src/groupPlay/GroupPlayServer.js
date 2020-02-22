import '../../shim';
import { NetworkInfo } from 'react-native-network-info';
import uuidv4 from 'uuid/v4';
import { common } from '../lib/Common';
import { setGroupPlayServer, stopGame } from '../../App';

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

class GroupPlayServer {
    create(registerGroupPlaySocket, claimGroupPlaySocket, receiveMessage, unregisterGroupPlayUser, activePlayer, username) {
        NetworkInfo.getIPV4Address().then(ipv4Address => {
            if (ipv4Address === null) {
                common.toast('Unable to determine IP address');
                return;
            }

            const server = net.createServer((socket) => {
                let socketId = uuidv4();

                registerGroupPlaySocket(socketId, socket);

                socket.on('data', (data) => {
                    let json = JSON.parse(data);

                    if (json.type === TYPE_GROUPPLAY_COMMAND) {
                        switch (json.command) {
                            case COMMAND_CLAIM_SOCKET:
                                claimGroupPlaySocket(json.sender, socketId);

                                socket.write(JSON.stringify({
                                    sender: username,
                                    type: TYPE_GROUPPLAY_COMMAND,
                                    command: COMMAND_SET_GM
                                }));
                                break;
                            case COMMAND_DISCONNECT:
                                receiveMessage(data);
                                unregisterGroupPlayUser(socketId);
                                break;
                            default:
                                // do nothing
                        }
                    } else if (json.type === TYPE_GROUPPLAY_MESSAGE) {
                        if (json.sender === activePlayer || activePlayer === PLAYER_OPTION_ALL) {
                            receiveMessage(data);
                        }
                    }
                });

                socket.on('error', (error) => {
                    receiveMessage(JSON.stringify({
                        sender: 'Server',
                        type: TYPE_GROUPPLAY_MESSAGE,
                        message: `${error}`
                    }));
                });

                socket.on('close', (error) => {
                    receiveMessage(JSON.stringify({
                        sender: 'Server',
                        type: TYPE_GROUPPLAY_MESSAGE,
                        message: `A player has left your game${error ? ` (${error})` : ''}`
                    }));

                    unregisterGroupPlayUser(socketId);
                });

                receiveMessage(JSON.stringify({
                    sender: 'Server',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: 'A new connection has been created'
                }));

                socket.write(JSON.stringify({
                    sender: username,
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: 'Welcome to my game session!'
                }));
            }).listen(GROUPPLAY_PORT, () => {
                receiveMessage(JSON.stringify({
                    sender: 'Server',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: `Your game session has started ask your players to connect to ${ipv4Address}`
                }));
            });

            server.on('error', (error) => {
                receiveMessage(JSON.stringify({
                    sender: 'Server',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: `${error}`
                }));
            });

            server.on('close', () => {
                console.log('Closing GroupPlay server')
            });

            setGroupPlayServer(server);
        });
    }

    setActivePlayer(activePlayer, username, connectedUsers) {
        for (const user of connectedUsers) {
            user.socket.write(JSON.stringify({
                sender: username,
                type: TYPE_GROUPPLAY_COMMAND,
                command: COMMAND_ACTIVE_PLAYER,
                username: activePlayer
            }));
        }
    }

    sendMessage(message, recipient, sender, connectedUsers) {
        for (const user of connectedUsers) {
            if (user.username === recipient || recipient === PLAYER_OPTION_ALL) {
                user.socket.write(JSON.stringify({
                    sender: sender,
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: message
                }));
            }
        }
    }
}

export let groupPlayServer = new GroupPlayServer();
