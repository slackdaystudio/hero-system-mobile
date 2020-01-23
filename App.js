import React, { Component }  from 'react';
import { createAppContainer } from 'react-navigation';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import thunk from 'redux-thunk';
import { Root } from 'native-base';
import Sound from 'react-native-sound';
import { soundPlayer, DEFAULT_SOUND } from './src/lib/SoundPlayer';
import reducer from './src/reducers/index';
import AppNavigator from './AppNavigator';

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

export function setSound(name, soundClip) {
    sounds[name] = soundClip;
}

export const store = createStore(reducer, applyMiddleware(thunk));

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
