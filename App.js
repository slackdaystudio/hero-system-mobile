import React, {useRef, useEffect, useMemo, useCallback} from 'react';
import {ActivityIndicator, Appearance, AppState, Image, SafeAreaView, useColorScheme} from 'react-native';
import {DefaultTheme, DarkTheme, NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {scale, ScaledSheet, verticalScale} from 'react-native-size-matters';
import prand from 'pure-rand';
import Toast, {BaseToast, ErrorToast} from 'react-native-toast-message';
import {Icon} from './src/components/Icon/Icon';
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
import {DARK, SYSTEM, useColorTheme} from './src/hooks/useColorTheme';
import {DatabaseProvider, useDatabase} from './src/contexts/DatabaseContext';

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

const getToastConfig = (Colors) => {
    return {
        success: (props) => (
            <BaseToast
                {...props}
                style={{
                    borderColor: Colors.secondaryForm,
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
                    borderColor: Colors.red,
                    backgroundColor: Colors.background,
                    color: Colors.background,
                    height: undefined,
                    minHeight: verticalScale(50),
                    paddingVertical: verticalScale(5),
                }}
                text1Style={{color: Colors.text, fontSize: verticalScale(14), lineHeight: verticalScale(14 * 1.35)}}
                text2Style={{fontSize: verticalScale(11), lineHeight: verticalScale(11 * 1.35)}}
                text2NumberOfLines={10}
            />
        ),
    };
};

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

const drawerIcon = (name, Colors) => {
    return <Icon solid name={name} style={{fontSize: verticalScale(14), color: Colors.tertiary, marginRight: 0}} />;
};

const selectColorScheme = (state) => {
    return state.settings.colorScheme;
};

const App = () => {
    const db = useDatabase();

    const loadDataCallback = useCallback(async () => {
        try {
            store.dispatch(initialize(db));
        } catch (error) {
            console.error(error);
        }
    }, [db]);

    useEffect(() => {
        loadDataCallback();
    }, [loadDataCallback]);

    const systemScheme = useColorScheme();

    let userColorScheme = store.getState().settings.colorScheme;

    const handleChange = () => {
        const previousValue = Appearance.getColorScheme();

        userColorScheme = selectColorScheme(store.getState());

        if (previousValue !== userColorScheme) {
            Appearance.setColorScheme(userColorScheme === SYSTEM ? null : userColorScheme);
        }
    };

    store.subscribe(handleChange);

    const scheme = userColorScheme;

    const {Colors} = useColorTheme(scheme);

    const localStyles = getLocalStyles(Colors);

    const theme = useMemo(() => {
        let s = userColorScheme === SYSTEM ? systemScheme : userColorScheme;

        const t = s === DARK ? DarkTheme : DefaultTheme;

        return {
            ...t,
            colors: {
                ...t.colors,
                background: Colors.background,
                text: Colors.text,
                primary: Colors.background,
                card: Colors.background,
            },
        };
    }, [Colors.background, Colors.text, systemScheme, userColorScheme]);

    const hsmIcon = () => <Image style={{tintColor: Colors.text, height: scale(50), width: scale(115)}} source={require('./public/hero_mobile_logo.png')} />;

    const drawerContentOptions = getDrawerContentOptions(Colors);

    const toastConfig = getToastConfig(Colors);

    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            // if (db === null) {
            //     return;
            // }

            switch (nextAppState) {
                case 'active':
                    persistence.getVersion().then((version) => {
                        if (version === null) {
                            persistence.setVersion(currentVersion.current).then(() => {
                                persistence.clearCaches(db).then(() => {
                                    store.dispatch(initialize(db));
                                });
                            });
                        } else if (version !== currentVersion.current) {
                            persistence.setVersion(currentVersion.current).then(() => {
                                if (currentVersion.onFirstLoad === 'flush') {
                                    persistence.clearCaches(db).then(() => {
                                        store.dispatch(initialize(db));
                                    });
                                } else {
                                    store.dispatch(initialize(db));
                                }
                            });
                        } else {
                            store.dispatch(initialize(db));
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
    }, [db]);

    if (db === null || userColorScheme === undefined) {
        return <ActivityIndicator color={Colors.text} />;
    }

    return (
        <Provider store={store}>
            <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}}>
                <GestureHandlerRootView style={{flex: 1}}>
                    <NavigationContainer theme={theme} onReady={() => SplashScreen.hide()}>
                        <Drawer.Navigator
                            screenOptions={{
                                headerShown: false,
                                drawerPosition: 'right',
                                swipeEdgeWidth: 0,
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
                                options={{drawerLabel: 'View Character', drawerIcon: () => drawerIcon('user', Colors)}}
                                name="ViewHeroDesignerCharacter"
                                component={ViewHeroDesignerCharacterScreen}
                            />
                            <Drawer.Screen
                                name="Characters"
                                options={{
                                    drawerIcon: () => drawerIcon('users', Colors),
                                }}
                                component={CharactersScreen}
                            />
                            <Drawer.Screen
                                options={{drawerLabel: '3D6', drawerIcon: () => drawerIcon('check-circle', Colors)}}
                                name="Skill"
                                children={(props) => <SkillScreen {...props} />}
                            />
                            <Drawer.Screen
                                name="Hit"
                                component={HitScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('bullseye', Colors),
                                }}
                            />
                            <Drawer.Screen
                                name="Damage"
                                component={DamageScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('kit-medical', Colors),
                                }}
                            />
                            <Drawer.Screen
                                name="Effect"
                                component={EffectScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('shield-virus', Colors),
                                }}
                            />
                            <Drawer.Screen
                                name="Result"
                                component={ResultScreen}
                                options={{
                                    drawerIcon: () => drawerIcon('dice', Colors),
                                }}
                            />
                            <Drawer.Screen
                                options={{drawerLabel: 'H.E.R.O.', drawerIcon: () => drawerIcon('mask', Colors)}}
                                name="RandomCharacter"
                                component={RandomCharacterScreen}
                            />
                            <Drawer.Screen
                                options={{drawerLabel: 'Cruncher', drawerIcon: () => drawerIcon('square-root-variable', Colors)}}
                                name="CostCruncher"
                                component={CostCruncherScreen}
                            />
                            <Drawer.Screen name="Statistics" component={StatisticsScreen} options={{drawerIcon: () => drawerIcon('chart-pie', Colors)}} />
                            <Drawer.Screen name="Settings" component={SettingsScreen} options={{drawerIcon: () => drawerIcon('gears', Colors)}} />
                        </Drawer.Navigator>
                    </NavigationContainer>
                    <Toast config={toastConfig} />
                </GestureHandlerRootView>
            </SafeAreaView>
        </Provider>
    );
};

export default () => {
    return (
        <DatabaseProvider>
            <App />
        </DatabaseProvider>
    );
};

const getLocalStyles = (Colors) =>
    ScaledSheet.create({
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

const getDrawerContentOptions = (Colors) => ({
    activeTintColor: Colors.secondaryForm,
    activeBackgroundColor: '#FFECCE',
    labelStyle: getLocalStyles(Colors).label,
});
