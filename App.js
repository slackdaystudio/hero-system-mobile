import React, { Component }  from 'react';
import { Alert } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import applyAppStateListener from 'redux-enhancer-react-native-appstate';
import thunk from 'redux-thunk';
import { Root } from 'native-base';
import Sound from 'react-native-sound';
import { asyncDispatchMiddleware } from './src/middleware/AsyncDispatchMiddleware';
import { soundPlayer, DEFAULT_SOUND } from './src/lib/SoundPlayer';
import reducer from './src/reducers/index';
import AppNavigator from './AppNavigator';
import { TYPE_GROUPPLAY_COMMAND, COMMAND_END_GAME, COMMAND_DISCONNECT } from './src/components/Screens/GroupPlayScreen';

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

export let sounds = {};

export let groupPlayServer = null;

export let groupPlayClient = null;

let setGroupPlayMode = null;

export function setSound(name, soundClip) {
    sounds[name] = soundClip;
}

export function setGroupPlayServer(server) {
    groupPlayServer = server;
}

export function stopGame(username, connectedUsers, unregisterGroupPlayUser, setMode) {
    for (const user of connectedUsers) {
        user.socket.write(JSON.stringify({
            sender: username,
            type: TYPE_GROUPPLAY_COMMAND,
            command: COMMAND_END_GAME
        }), 'utf8', () => {
            unregisterGroupPlayUser(user.id);
        });
    }

    groupPlayServer.close(() => {
        setGroupPlayServer(null);
        setMode(null);
    });
}

export function setGroupPlayClient(client) {
    groupPlayClient = client;
}

export function leaveGame(username, setMode, sayGoodbye = true) {
    if (sayGoodbye) {
        groupPlayClient.write(JSON.stringify({
            sender: username,
            type: TYPE_GROUPPLAY_COMMAND,
            command: COMMAND_DISCONNECT,
            message: 'Goodbye.'
        }));
    }

    if (groupPlayClient !== null) {
        groupPlayClient.destroy();

        setGroupPlayClient(null);

        setMode(null);
    }
}

export const store = createStore(
    reducer,
    compose(
        applyAppStateListener(),
        applyMiddleware(thunk),
        applyMiddleware(asyncDispatchMiddleware)
    )
);

const AppContainer = createAppContainer(AppNavigator);

export default class App extends Component {
    componentDidMount() {
        soundPlayer.initialize(DEFAULT_SOUND, false);

        // Adding a 100ms delay here gets rid of a white screen
        setTimeout(() => SplashScreen.hide(), 100);
    }

    render() {
        return (
            <Provider store={store}>
                <Root>
                    <AppContainer />
                </Root>
            </Provider>
        );
    }
}
