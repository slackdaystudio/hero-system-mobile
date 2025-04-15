import React, {useRef, useEffect} from 'react';
import {AppState, Image, SafeAreaView} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {scale, ScaledSheet, verticalScale} from 'react-native-size-matters';
import prand from 'pure-rand';
import Toast, {BaseToast, ErrorToast} from 'react-native-toast-message';
import {Icon} from './src/components/Icon/Icon';
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
import {Colors} from './src/Styles';

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

const MyTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        primary: Colors.background,
        background: Colors.background,
        card: Colors.background,
    },
};

const toastConfig = {
    success: (props) => (
        <BaseToast
            {...props}
            style={{
                borderColor: '#35e01b',
                backgroundColor: Colors.background,
                color: Colors.background,
                height: undefined,
                minHeight: verticalScale(50),
                paddingVertical: verticalScale(5),
            }}
            text1Style={{color: Colors.background, fontSize: verticalScale(14), lineHeight: verticalScale(14 * 1.35)}}
            text2Style={{fontSize: verticalScale(11), lineHeight: verticalScale(11 * 1.35)}}
            text2NumberOfLines={10}
        />
    ),
    error: (props) => (
        <ErrorToast
            {...props}
            style={{
                borderColor: '#e01b35',
                backgroundColor: Colors.background,
                color: Colors.background,
                height: undefined,
                minHeight: verticalScale(50),
                paddingVertical: verticalScale(5),
            }}
            text1Style={{color: Colors.background, fontSize: verticalScale(14), lineHeight: verticalScale(14 * 1.35)}}
            text2Style={{fontSize: verticalScale(11), lineHeight: verticalScale(11 * 1.35)}}
            text2NumberOfLines={10}
        />
    ),
};

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
        if (common.isEmptyObject(store.getState().character.character) && item.name === 'ViewHeroDesignerCharacter') {
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
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

// eslint-disable-next-line no-bitwise
let rng = prand.xoroshiro128plus(Date.now() ^ (Math.random() * 0x100000000));

export const getRandomNumber = (min, max, rolls = 1, increaseEntropyOveride = undefined) => {
    const results = [];
    const increaseEntropy = increaseEntropyOveride === undefined ? store.getState().settings.increaseEntropy : increaseEntropyOveride === true;

    if (increaseEntropy) {
        for (let i = 0; i < rolls; i++) {
            const [roll, nextRng] = prand.uniformIntDistribution(min, max, rng);

            results.push(roll);

            rng = nextRng;
        }
    } else {
        for (let i = 0; i < rolls; i++) {
            results.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
    }

    return results.length === 1 ? results[0] : results;
};

const drawerIcon = (name) => {
    return <Icon solid name={name} style={{fontSize: verticalScale(14), color: Colors.tertiary, marginRight: 0}} />;
};

export const App = () => {
    soundPlayer.initialize(DEFAULT_SOUND, false);

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
                <GestureHandlerRootView style={{flex: 1}}>
                    <NavigationContainer theme={MyTheme} onReady={() => SplashScreen.hide()}>
                        <Drawer.Navigator
                            screenOptions={{
                                headerShown: false,
                                drawerPosition: 'right',
                                drawerContentOptions: drawerContentOptions,
                                drawerStyle: localStyles.drawer,
                                drawerLabelStyle: {color: Colors.text},
                                contentStyle: {
                                    backgroundColor: '#000000',
                                },
                            }}
                            initialRouteName="Home"
                            backBehavior="history"
                            drawerContent={CustomDrawerContent}
                        >
                            <Drawer.Screen options={{drawerLabel: hsmIcon}} name="Home" component={HomeScreen} />
                            <Drawer.Screen
                                options={{drawerLabel: 'View Character', drawerIcon: () => drawerIcon('user')}}
                                name="ViewHeroDesignerCharacter"
                                component={ViewHeroDesignerCharacterScreen}
                            />
                            <Drawer.Screen
                                name="Characters"
                                options={{
                                    drawerIcon: () => drawerIcon('users'),
                                }}
                                component={CharactersScreen}
                            />
                            <Drawer.Screen
                                options={{drawerLabel: '3D6', drawerIcon: () => drawerIcon('check-circle')}}
                                name="Skill"
                                children={(props) => <SkillScreen {...props} />}
                            />
                            <Drawer.Screen
                                name="Hit"
                                component={HitScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('bullseye'),
                                }}
                            />
                            <Drawer.Screen
                                name="Damage"
                                component={DamageScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('kit-medical'),
                                }}
                            />
                            <Drawer.Screen
                                name="Effect"
                                component={EffectScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('shield-virus'),
                                }}
                            />
                            <Drawer.Screen
                                name="Result"
                                component={ResultScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('dice'),
                                }}
                            />
                            <Drawer.Screen
                                options={{drawerLabel: 'H.E.R.O.', drawerIcon: () => drawerIcon('mask')}}
                                name="RandomCharacter"
                                component={RandomCharacterScreen}
                            />
                            <Drawer.Screen
                                options={{drawerLabel: 'Cruncher', drawerIcon: () => drawerIcon('square-root-variable')}}
                                name="CostCruncher"
                                component={CostCruncherScreen}
                            />
                            <Drawer.Screen name="Statistics" component={StatisticsScreen} options={{drawerIcon: () => drawerIcon('chart-pie')}} />
                            <Drawer.Screen name="Settings" component={SettingsScreen} options={{drawerIcon: () => drawerIcon('gears')}} />
                        </Drawer.Navigator>
                    </NavigationContainer>
                    <Toast config={toastConfig} />
                </GestureHandlerRootView>
            </SafeAreaView>
        </Provider>
    );
};

const localStyles = ScaledSheet.create({
    drawer: {
        backgroundColor: Colors.primary,
        borderWidth: 0.5,
        borderLeftColor: Colors.secondaryForm,
        width: '180@s',
        color: Colors.text,
    },
    label: {
        color: Colors.text,
        fontSize: '14@vs',
    },
});

const drawerContentOptions = {
    activeTintColor: Colors.secondaryForm,
    activeBackgroundColor: '#FFECCE',
    labelStyle: localStyles.label,
};
