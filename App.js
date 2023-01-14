/* eslint-disable no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import React, {Component} from 'react';
import {SafeAreaView} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import {configureStore, applyMiddleware, compose} from 'redux';
import {Provider} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {ScaledSheet} from 'react-native-size-matters';
import applyAppStateListener from 'redux-enhancer-react-native-appstate';
import thunk from 'redux-thunk';
import {Root} from 'native-base';
import {asyncDispatchMiddleware} from './src/middleware/AsyncDispatchMiddleware';
import {soundPlayer, DEFAULT_SOUND} from './src/lib/SoundPlayer';
import reducer from './src/reducers/index';
import HomeScreen from './src/components/Screens/HomeScreen';
import CharactersScreen from './src/components/Screens/CharactersScreen';
import ViewHeroDesignerCharacterScreen from './src/components/Screens/ViewHeroDesignerCharacterScreen';
import RandomCharacterScreen from './src/components/Screens/RandomCharacterScreen';
import ResultScreen from './src/components/Screens/ResultScreen';
import SkillScreen from './src/components/Screens/SkillScreen';
import HitScreen from './src/components/Screens/HitScreen';
import DamageScreen from './src/components/Screens/DamageScreen';
import EffectScreen from './src/components/Screens/EffectScreen';
import CostCruncherScreen from './src/components/Screens/CostCruncherScreen';
import StatisticsScreen from './src/components/Screens/StatisticsScreen';
import SettingsScreen from './src/components/Screens/SettingsScreen';
import Sidebar from './src/components/Sidebar/Sidebar';

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

const Drawer = createDrawerNavigator();

const HIDDEN_SCREENS = [];

const CustomDrawerContent = (props) => {
    const {state, ...rest} = props;
    const newState = {...state};
    const {index, routes} = props.navigation.dangerouslyGetState();
    const currentRoute = routes[index].name;

    // Filter out routes that are hidden either all the time or contextually
    newState.routes = newState.routes.filter((item, i) => {
        if (store.getState().character.workingCharacter === null && (item.name === 'ViewHeroDesignerCharacterScreen' || item.name === 'CharactersScreen')) {
            return false;
        }

        return !HIDDEN_SCREENS.includes(item.name);
    });

    // Loop over the remaining routes and set the selected index based on the current route name (for highlighting)
    for (let i = 0; i < newState.routes.length; i++) {
        if (currentRoute === newState.routes[i].name) {
            newState.index = i;
            break;
        }
    }

    return (
        <DrawerContentScrollView {...props}>
            <DrawerItemList state={newState} {...rest} />
        </DrawerContentScrollView>
    );
};

export function setSound(name, soundClip) {
    sounds[name] = soundClip;
}

export const store = configureStore(reducer, compose(applyAppStateListener(), applyMiddleware(thunk), applyMiddleware(asyncDispatchMiddleware)));

// const AppContainer = createAppContainer(AppNavigator);

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
                    <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}}>
                        <NavigationContainer>
                            <Drawer.Navigator
                                drawerStyle={localStyles.drawer}
                                drawerContentOptions={drawerContentOptions}
                                screenOptions={{headerShown: false}}
                                initialRoute="Home"
                                drawerPosition="right"
                                drawerContent={(props) => <CustomDrawerContent {...props} />}
                            >
                                <Drawer.Screen options={{drawerLabel: 'Home'}} name="Home" component={HomeScreen} />
                                <Drawer.Screen
                                    options={{drawerLabel: 'View Characteer'}}
                                    name="ViewHeroDesignerCharacter"
                                    component={ViewHeroDesignerCharacterScreen}
                                />
                                <Drawer.Screen name="Characters" component={CharactersScreen} />
                                <Drawer.Screen name="3D6" component={SkillScreen} />
                            </Drawer.Navigator>
                        </NavigationContainer>
                    </SafeAreaView>
                </Root>
            </Provider>
        );
    }
}

const localStyles = ScaledSheet.create({
    drawer: {
        backgroundColor: 'rgb(81, 111, 148)',
        borderWidth: 0.5,
        borderLeftColor: '#fff',
        width: '220@vs',
    },
    label: {
        color: '#AFC0D4',
        fontSize: '14@vs',
    },
});

const drawerContentOptions = {
    activeTintColor: '#172535',
    activeBackgroundColor: '#FFECCE',
    labelStyle: localStyles.label,
};
