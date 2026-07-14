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

import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Text} from 'app/components';
import type {RollRequest} from 'app/dice/rollRequest';
import {useSettings} from 'app/providers/SettingsProvider';
import {CharacterDetailScreen} from 'app/screens/CharacterDetailScreen';
import {CharacterListScreen} from 'app/screens/CharacterListScreen';
import {DiceScreen} from 'app/screens/DiceScreen';
import {SettingsScreen} from 'app/screens/SettingsScreen';
import {StatisticsScreen} from 'app/screens/StatisticsScreen';
import {useTheme} from 'app/theme';

/**
 * The only file that knows about react-navigation. Screens stay pure and
 * props-driven (and so testable without a navigation container); this navigator
 * is the single seam that wires them into a themed native stack.
 */
export type RootStackParamList = {
    CharacterList: undefined;
    CharacterDetail: {id: string};
    Dice: {request?: RollRequest} | undefined;
    Statistics: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(): React.JSX.Element {
    const theme = useTheme();
    const {settings} = useSettings();

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: {backgroundColor: theme.colors.surface},
                        headerTintColor: theme.colors.text,
                        contentStyle: {backgroundColor: theme.colors.background},
                        // Respect the reduce-motion preference: no push/pop transition when off.
                        animation: settings.showAnimations ? 'default' : 'none',
                    }}>
                    <Stack.Screen
                        name="CharacterList"
                        options={({navigation}) => ({
                            title: 'Characters',
                            // headerRight is a react-navigation render prop, not a nested component definition.
                            // eslint-disable-next-line react/no-unstable-nested-components
                            headerRight: () => (
                                <View style={styles.headerActions}>
                                    <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Dice')}>
                                        <Text variant="label" color={theme.colors.primary}>
                                            Dice
                                        </Text>
                                    </Pressable>
                                    <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')}>
                                        <Text variant="label" color={theme.colors.primary}>
                                            Settings
                                        </Text>
                                    </Pressable>
                                </View>
                            ),
                        })}>
                        {({navigation}) => <CharacterListScreen onSelect={(id) => navigation.navigate('CharacterDetail', {id})} />}
                    </Stack.Screen>
                    <Stack.Screen name="CharacterDetail" options={{title: ''}}>
                        {({route, navigation}) => (
                            <CharacterDetailScreen
                                characterId={route.params.id}
                                onReady={(character) => navigation.setOptions({title: character.name})}
                                onRollRequest={(request) => navigation.navigate('Dice', {request})}
                            />
                        )}
                    </Stack.Screen>
                    <Stack.Screen
                        name="Dice"
                        options={({navigation}) => ({
                            title: 'Dice Roller',
                            // headerRight is a react-navigation render prop, not a nested component definition.
                            // eslint-disable-next-line react/no-unstable-nested-components
                            headerRight: () => (
                                <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Statistics')}>
                                    <Text variant="label" color={theme.colors.primary}>
                                        Stats
                                    </Text>
                                </Pressable>
                            ),
                        })}>
                        {({route}) => <DiceScreen initialRequest={route.params?.request} />}
                    </Stack.Screen>
                    <Stack.Screen name="Statistics" options={{title: 'Statistics'}}>
                        {() => <StatisticsScreen />}
                    </Stack.Screen>
                    <Stack.Screen name="Settings" options={{title: 'Settings'}}>
                        {() => <SettingsScreen />}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    headerActions: {
        flexDirection: 'row',
        columnGap: 16,
    },
});
