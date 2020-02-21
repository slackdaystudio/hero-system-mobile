import '../../shim';
import {
    GROUPPLAY_PORT,
    TYPE_GROUPPLAY_COMMAND,
    TYPE_GROUPPLAY_MESSAGE,
    COMMAND_CLAIM_SOCKET,
    COMMAND_END_GAME,
    COMMAND_ACTIVE_PLAYER
} from './GroupPlayServer';
import { common } from '../lib/Common';
import { setGroupPlayClient, leaveGame } from '../../App';

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

class GroupPlayClient {
    create(receiveMessage, username, ip, setActivePlayer, setMode) {
        let client = net.createConnection(GROUPPLAY_PORT, ip, () => {
            try {
                client.write(JSON.stringify({
                    sender: username,
                    type: TYPE_GROUPPLAY_COMMAND,
                    command: COMMAND_CLAIM_SOCKET
                }));

                receiveMessage(JSON.stringify({
                    sender: 'Client',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: `Connected to ${ip}`
                }));

                client.write(JSON.stringify({
                    sender: username,
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: 'Let\'s do this!'
                }));
            } catch (error) {
                common.toast('Error connecting to GroupPlay game server');
            }
        });

        client.on('data', (data) => {
            let json = JSON.parse(data.toString());

            if (json.type === TYPE_GROUPPLAY_COMMAND) {
                switch (json.command) {
                    case COMMAND_END_GAME:
                        receiveMessage(JSON.stringify({
                            sender: json.sender,
                            type: TYPE_GROUPPLAY_MESSAGE,
                            message: 'The session has ended, thanks for playing!'
                        }));

                        leaveGame(username, setMode, false);
                        break;
                    case COMMAND_ACTIVE_PLAYER:
                        setActivePlayer(json.username);

                        if (username === json.username) {
                            receiveMessage(JSON.stringify({
                                sender: json.sender,
                                type: TYPE_GROUPPLAY_MESSAGE,
                                message: 'It\s your turn to act, what do you want to do?'
                            }));
                        }
                        break;
                    default:
                        // Do nothing
                }
            } else if (json.type === TYPE_GROUPPLAY_MESSAGE) {
                receiveMessage(data);
            }
        });

        client.on('error', (error) => {
            receiveMessage(JSON.stringify({
                sender: 'Client',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: `${error}`
            }));

            leaveGame(username, setMode, false);
        });

        client.on('close', () => {
            receiveMessage(JSON.stringify({
                sender: 'Client',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: 'Your connection has been closed'
            }));

            leaveGame(username, setMode, false);
        });

        client.on('end', (error) => {
            receiveMessage(JSON.stringify({
                sender: 'Client',
                type: TYPE_GROUPPLAY_MESSAGE,
                message: `You have left the game session${error ? ` (${error})` : ''}`
            }));

            leaveGame(username, setMode, false);
        });

        setGroupPlayClient(client);
    }
}

export let groupPlayClient = new GroupPlayClient();
