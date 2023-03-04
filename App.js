/* eslint-disable no-unused-vars */
import React, {Component, Fragment} from 'react';
import {Image, Pressable, SafeAreaView, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import {createStore, configureStore, applyMiddleware, compose} from 'redux';
import {Provider} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {scale, ScaledSheet, verticalScale} from 'react-native-size-matters';
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
import {TEXT_COLOR} from './src/Styles';

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

export const sounds = {};

const Drawer = createDrawerNavigator();

const HIDDEN_SCREENS = ['Result'];

const drawerContent = (props) => <CustomDrawerContent {...props} />;

const hsmIcon = () => <Image style={{height: scale(50), width: scale(115)}} source={require('./public/hero_mobile_logo.png')} />;

const CustomDrawerContent = (props) => {
    const {state, ...rest} = props;
    const newState = {...state};
    const {index, routes} = props.navigation.getState();
    const currentRoute = routes[index].name;

    // Filter out routes that are hidden either all the time or contextually
    newState.routes = newState.routes.filter((item, i) => {
        if (store.getState().character.workingCharacter === undefined && (item.name === 'ViewHeroDesignerCharacter' || item.name === 'Characters')) {
            return false;
        }

        return !HIDDEN_SCREENS.includes(item.name);
    });

    // Loop over the remaining routes and set the selected index based on the current route name (for highlighting)
    for (let i = 0; i < newState.routes.length; i++) {
        console.log(`Current Route: ${currentRoute}, Loop Route: ${newState.routes[i].name}`);
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

export const store = createStore(reducer, compose(applyAppStateListener(), applyMiddleware(thunk), applyMiddleware(asyncDispatchMiddleware)));

const Home = (props) => {
    return <HomeScreen {...props} />;
};

export default class App extends Component {
    componentDidMount() {
        soundPlayer.initialize(DEFAULT_SOUND, false);

        // Adding a 100ms delay here gets rid of a white screen
        setTimeout(() => SplashScreen.hide(), 100);
    }

    render() {
        return (
            <Provider store={store}>
                <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}}>
                    <GestureHandlerRootView style={{flex: 1}}>
                        <NavigationContainer>
                            <Root>
                                <Drawer.Navigator
                                    screenOptions={{
                                        headerShown: false,
                                        drawerPosition: 'right',
                                        drawerContentOptions: drawerContentOptions,
                                        drawerStyle: localStyles.drawer,
                                        drawerLabelStyle: {color: '#F3EDE9'},
                                    }}
                                    initialRouteName="Home"
                                    backBehavior="history"
                                    drawerContent={(props) => drawerContent(props)}
                                >
                                    <Drawer.Screen options={{drawerLabel: hsmIcon}} name="Home" component={Home} />
                                    <Drawer.Screen
                                        options={{drawerLabel: 'View Character'}}
                                        name="ViewHeroDesignerCharacter"
                                        component={ViewHeroDesignerCharacterScreen}
                                    />
                                    <Drawer.Screen name="Characters" component={CharactersScreen} />
                                    <Drawer.Screen options={{drawerLabel: '3D6'}} name="Skill" children={(props) => <SkillScreen {...props} />} />
                                    <Drawer.Screen name="Hit" component={HitScreen} />
                                    <Drawer.Screen name="Damage" component={DamageScreen} />
                                    <Drawer.Screen name="Effect" component={EffectScreen} />
                                    <Drawer.Screen name="Result" component={ResultScreen} />
                                    <Drawer.Screen options={{drawerLabel: 'H.E.R.O.'}} name="RandomCharacter" component={RandomCharacterScreen} />
                                    <Drawer.Screen options={{drawerLabel: 'Cruncher'}} name="CostCruncher" component={CostCruncherScreen} />
                                    <Drawer.Screen name="Statistics" component={StatisticsScreen} />
                                    <Drawer.Screen name="Settings" component={SettingsScreen} />
                                </Drawer.Navigator>
                            </Root>
                        </NavigationContainer>
                    </GestureHandlerRootView>
                </SafeAreaView>
            </Provider>
        );
    }
}

const localStyles = ScaledSheet.create({
    drawer: {
        backgroundColor: '#1b1d1f',
        borderWidth: 0.5,
        borderLeftColor: '#303030',
        width: '220@vs',
        color: '#F3EDE9',
    },
    label: {
        color: '#F3EDE9',
        fontSize: '14@vs',
    },
});

const drawerContentOptions = {
    activeTintColor: '#172535',
    activeBackgroundColor: '#FFECCE',
    labelStyle: localStyles.label,
};
