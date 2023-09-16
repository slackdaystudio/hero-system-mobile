import React, {useRef, useEffect} from 'react';
import {AppState, Image, SafeAreaView} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {scale, ScaledSheet} from 'react-native-size-matters';
import {Root} from 'native-base';
import {soundPlayer, DEFAULT_SOUND} from './src/lib/SoundPlayer';
import rootReducer from './src/reducers';
import {HomeScreen} from './src/components/Screens/HomeScreen';
import {CharactersScreen} from './src/components/Screens/CharactersScreen';
import {ViewHeroDesignerCharacterScreen} from './src/components/Screens/ViewHeroDesignerCharacterScreen';
import {RandomCharacterScreen} from './src/components/Screens/RandomCharacterScreen';
import {ResultScreen} from './src/components/Screens/ResultScreen';
import {SkillScreen} from './src/components/Screens/SkillScreen';
import {HitScreen} from './src/components/Screens/HitScreen';
import {DamageScreen} from './src/components/Screens/DamageScreen';
import {EffectScreen} from './src/components/Screens/EffectScreen';
import {CostCruncherScreen} from './src/components/Screens/CostCruncherScreen';
import {StatisticsScreen} from './src/components/Screens/StatisticsScreen';
import {SettingsScreen} from './src/components/Screens/SettingsScreen';
import {persistence} from './src/lib/Persistence';
import {common} from './src/lib/Common';
import {initialize} from './src/reducers/appState';
import {saveCachedCharacter} from './src/reducers/character';
import currentVersion from './public/version.json';

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

const hsmIcon = () => <Image style={{height: scale(50), width: scale(115)}} source={require('./public/hero_mobile_logo.png')} />;

const CustomDrawerContent = (props) => {
    const {state, ...rest} = props;
    const newState = {...state};
    const {index, routes} = props.navigation.getState();
    const currentRoute = routes[index].name;

    // Filter out routes that are hidden either all the time or contextually
    newState.routes = newState.routes.filter((item, i) => {
        if (store.getState().character.character === undefined && (item.name === 'ViewHeroDesignerCharacter' || item.name === 'Characters')) {
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

export const store = configureStore({
    reducer: rootReducer,
});

export const App = () => {
    soundPlayer.initialize(DEFAULT_SOUND, false);

    setTimeout(() => SplashScreen.hide(), 200);

    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            switch (nextAppState) {
                case 'active':
                    persistence.getVersion().then((version) => {
                        if (version === null) {
                            persistence.setVersion(currentVersion.current).then(() => {
                                persistence.clearCaches().then(() => {
                                    store.dispatch(initialize());
                                });
                            });
                        } else if (version !== currentVersion.current) {
                            persistence.setVersion(currentVersion.current).then(() => {
                                if (currentVersion.onFirstLoad === 'flush') {
                                    persistence.clearCaches().then(() => {
                                        store.dispatch(initialize());
                                    });
                                } else {
                                    store.dispatch(initialize());
                                }
                            });
                        } else {
                            store.dispatch(initialize());
                        }
                    });

                    break;
                case 'background':
                case 'inactive':
                    if (!common.isEmptyObject(store.getState().character.character)) {
                        store.dispatch(
                            saveCachedCharacter({character: store.getState().character.character, characters: store.getState().character.characters}),
                        );
                    }

                    break;
                default:
                // Do nothing
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <Provider store={store}>
            <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}}>
                <Root>
                    <GestureHandlerRootView style={{flex: 1}}>
                        <NavigationContainer>
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
                                drawerContent={CustomDrawerContent}
                            >
                                {/* <Drawer.Screen name="Home" component={Home} /> */}
                                <Drawer.Screen options={{drawerLabel: hsmIcon}} name="Home" component={HomeScreen} />
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
                        </NavigationContainer>
                    </GestureHandlerRootView>
                </Root>
            </SafeAreaView>
        </Provider>
    );
};

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
