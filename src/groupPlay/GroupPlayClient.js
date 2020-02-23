import '../../shim';
import {
    GROUPPLAY_PORT,
    TYPE_GROUPPLAY_COMMAND,
    TYPE_GROUPPLAY_MESSAGE,
    COMMAND_CLAIM_SOCKET,
    COMMAND_END_GAME,
    COMMAND_ACTIVE_PLAYER,
    COMMAND_SET_GM,
    COMMAND_DISCONNECT,
    PLAYER_OPTION_ALL
} from './GroupPlayServer';
import { common } from '../lib/Common';
import { ACTION_NOTIFICATION_SOUND, soundPlayer } from '../lib/SoundPlayer';
import { setGroupPlayClient } from '../../App';

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

export default class GroupPlayClient {
    constructor(ip, username, receiveMessage, setActive, setActivePlayer) {
        this.client = null;
        this.ip = ip;
        this.username = username;
        this.gm = null;
        this.activePlayer = PLAYER_OPTION_ALL;
        this.receiveMessage = receiveMessage;
        this.setActive = setActive;
        this.setActivePlayer = setActivePlayer;

        this._create();
    }

    isActivePlayer() {
        return this.username === this.activePlayer;
    }

    sendMessage(message) {
        this.client.write(JSON.stringify({
            sender: this.username,
            type: TYPE_GROUPPLAY_MESSAGE,
            message: message
        }));
    }

    leaveGame(sayGoodbye = true) {
        if (sayGoodbye) {
            this.client.write(JSON.stringify({
                sender: this.username,
                type: TYPE_GROUPPLAY_COMMAND,
                command: COMMAND_DISCONNECT,
                message: 'Goodbye.'
            }));
        }

        if (this.client !== null) {
            if (!this.client.pending) {
                this.client.destroy(() => {
                    console.log('Unable to destroy client');
                });
            }

            setGroupPlayClient(null);

            this.setActive(false);
        }
    }

    _create() {
        this.client = net.createConnection(GROUPPLAY_PORT, this.ip);

        this.client.on('connect', (client) => {
            this.client.write(JSON.stringify({
                sender: this.username,
                type: TYPE_GROUPPLAY_COMMAND,
                command: COMMAND_CLAIM_SOCKET
            }));

            this.receiveMessage(JSON.stringify({
                sender: 'Client',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: `Connected to ${this.ip}`
            }));

            this.client.write(JSON.stringify({
                sender: this.username,
                type: TYPE_GROUPPLAY_MESSAGE,
                message: 'Let\'s do this!'
            }));
        });

        this.client.on('data', (data) => {
            this._processMessage(data);
        });

        this.client.on('error', (error) => {
            this.receiveMessage(JSON.stringify({
                sender: 'Client',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: `${error}`
            }));

            this.leaveGame(false);
        });

        this.client.on('close', () => {
            this.receiveMessage(JSON.stringify({
                sender: 'Client',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: 'Your connection has been closed'
            }));

            this.leaveGame(false);
        });

        this.client.on('end', (error) => {
            this.receiveMessage(JSON.stringify({
                sender: 'Client',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: `You have left the game session${error ? ` (${error})` : ''}`
            }));

            // this.leaveGame(false);
        });

        this.setActive(true);
    }

    _processMessage(data) {
        let json = JSON.parse(data.toString());

        if (json.type === TYPE_GROUPPLAY_COMMAND) {
            switch (json.command) {
                case COMMAND_END_GAME:
                    this.receiveMessage(JSON.stringify({
                        sender: json.sender,
                        type: TYPE_GROUPPLAY_MESSAGE,
                        message: 'The session has ended, thanks for playing!'
                    }));

                    this.leaveGame(false);
                    break;
                case COMMAND_ACTIVE_PLAYER:
                    this.activePlayer = json.username;
                    this.setActivePlayer(json.username);

                    if (this.username === json.username) {
                        this.receiveMessage(JSON.stringify({
                            sender: json.sender,
                            type: TYPE_GROUPPLAY_MESSAGE,
                            message: 'It\s your turn to act, what do you want to do?'
                        }));
                    }

                    if (this.isActivePlayer()) {
                        soundPlayer.play(ACTION_NOTIFICATION_SOUND);
                    }

                    break;
                case COMMAND_SET_GM:
                    this.gm = json.sender;
                    break;
                default:
                    // Do nothing
            }
        } else if (json.type === TYPE_GROUPPLAY_MESSAGE) {
            this.receiveMessage(data);
        }
    }
}
