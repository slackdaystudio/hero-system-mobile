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

import React, {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, StyleSheet, View} from 'react-native';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import {createNativeStackNavigator, type NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import type {ImportResult} from 'infra/import';
import {Text} from 'app/components';
import type {RollRequest} from 'app/dice/rollRequest';
import {type GenerateResult} from 'app/providers/GenerateProvider';
import {GenerateDialog} from 'app/screens/GenerateDialog';
import {useImportCharacter} from 'app/providers/ImportProvider';
import {useSettings} from 'app/providers/SettingsProvider';
import {CharacterDetailScreen} from 'app/screens/CharacterDetailScreen';
import {CharacterListScreen} from 'app/screens/CharacterListScreen';
import {DiceScreen} from 'app/screens/DiceScreen';
import {HomeScreen} from 'app/screens/HomeScreen';
import {SettingsScreen} from 'app/screens/SettingsScreen';
import {StatisticsScreen} from 'app/screens/StatisticsScreen';
import {useTheme} from 'app/theme';

/**
 * The only file that knows about react-navigation. Screens stay pure and
 * props-driven (and so testable without a navigation container); this navigator
 * is the single seam that wires them into a themed native stack.
 */
export type RootStackParamList = {
    Home: undefined;
    CharacterList: undefined;
    CharacterDetail: {id: string};
    Dice: {request?: RollRequest; mode?: RollRequest['mode']} | undefined;
    Statistics: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(): React.JSX.Element {
    const theme = useTheme();
    const {settings} = useSettings();
    // Bumped after a successful import so the character list reloads.
    const [importToken, setImportToken] = useState(0);

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
                    <Stack.Screen name="Home" options={{title: 'HERO System Mobile'}}>
                        {({navigation}) => <HomeRoute navigation={navigation} />}
                    </Stack.Screen>
                    <Stack.Screen
                        name="CharacterList"
                        options={({navigation}) => ({
                            title: 'Characters',
                            // headerRight is a react-navigation render prop, not a nested component definition.
                            // eslint-disable-next-line react/no-unstable-nested-components
                            headerRight: () => (
                                <View style={styles.headerActions}>
                                    <GenerateButton
                                        onGenerated={(result) => {
                                            setImportToken((token) => token + 1);
                                            navigation.navigate('CharacterDetail', {id: result.id});
                                        }}
                                    />
                                    <ImportButton
                                        onImported={(result) => {
                                            setImportToken((token) => token + 1);
                                            navigation.navigate('CharacterDetail', {id: result.id});
                                        }}
                                    />
                                </View>
                            ),
                        })}>
                        {({navigation}) => <CharacterListScreen refreshToken={importToken} onSelect={(id) => navigation.navigate('CharacterDetail', {id})} />}
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
                        {({route}) => <DiceScreen initialRequest={route.params?.request} initialMode={route.params?.mode} />}
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

/**
 * Home, reloaded whenever it comes back into focus.
 *
 * Home is the stack's root, so opening a character *pushes on top of it* — it never unmounts, and
 * its mount effect fires exactly once per app launch. Its "Recent" list is ordered by `accessed_at`
 * (which `CharacterDetailScreen` updates on open) and a character can be deleted while Home is
 * parked, so without this the list would show the launch-time order for the whole session.
 *
 * Focus lives here rather than in the screen: `HomeScreen` stays props-driven and testable without
 * a navigation container.
 *
 * Exported for its test, which mounts it in a real stack — the skip-first-focus below is the kind
 * of thing that only a real navigator can falsify.
 */
export function HomeRoute({navigation}: {navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>}): React.JSX.Element {
    const [focusToken, setFocusToken] = useState(0);
    const mounted = useRef(false);

    useFocusEffect(
        useCallback(() => {
            // Home mounts already focused and loads itself, so the first focus needs no nudge —
            // only the returns from a pushed screen do.
            if (mounted.current) {
                setFocusToken((token) => token + 1);
            }
            mounted.current = true;
        }, []),
    );

    return (
        <HomeScreen
            refreshToken={focusToken}
            onOpenCharacters={() => navigation.navigate('CharacterList')}
            onOpenCharacter={(id) => navigation.navigate('CharacterDetail', {id})}
            onOpenDice={(mode) => navigation.navigate('Dice', {mode})}
            onOpenStatistics={() => navigation.navigate('Statistics')}
            onOpenSettings={() => navigation.navigate('Settings')}
        />
    );
}

/**
 * Header action that opens the roll dialog (docs/RANDOM_CHARACTER.md).
 *
 * Owns the dialog's `visible` the way `SelectField` owns its own — a Modal portals to the root
 * regardless of where it is mounted, so living under `headerRight` costs nothing and keeps the
 * button and the thing it opens in one place.
 */
function GenerateButton({onGenerated}: {onGenerated: (result: GenerateResult) => void}): React.JSX.Element {
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <>
            <Pressable accessibilityRole="button" onPress={() => setOpen(true)} testID="generate-character">
                <Text variant="label" color={theme.colors.primary}>
                    Generate
                </Text>
            </Pressable>
            <GenerateDialog
                visible={open}
                onClose={() => setOpen(false)}
                onGenerated={(result) => {
                    setOpen(false);
                    onGenerated(result);
                }}
            />
        </>
    );
}

/** Header action that picks a HERO Designer `.hdc` and imports it, then reports the result. */
function ImportButton({onImported}: {onImported: (result: ImportResult) => void}): React.JSX.Element {
    const theme = useTheme();
    const importCharacter = useImportCharacter();
    const [busy, setBusy] = useState(false);

    const run = async (): Promise<void> => {
        if (busy) {
            return;
        }
        setBusy(true);
        try {
            const result = await importCharacter();
            if (result !== null) {
                onImported(result);
            }
        } catch (error) {
            Alert.alert('Import failed', error instanceof Error ? error.message : 'That file could not be imported.');
        } finally {
            setBusy(false);
        }
    };

    if (busy) {
        return <ActivityIndicator color={theme.colors.primary} />;
    }

    return (
        <Pressable accessibilityRole="button" onPress={run}>
            <Text variant="label" color={theme.colors.primary}>
                Import
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    /** Generate sits beside Import in the Characters header. */
    headerActions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 16,
    },
});
