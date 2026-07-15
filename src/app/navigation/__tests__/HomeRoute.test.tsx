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

/**
 * Home's reload-on-focus, driven through a **real** native stack.
 *
 * `HomeScreen`'s own test proves it reloads when `refreshToken` changes; this proves the token
 * actually changes at the right moments. It needs a real navigator because the thing under test is
 * react-navigation's focus lifecycle: Home is the stack root, so it never unmounts, and a mount-only
 * load can never notice that "Recent" has been reordered or a character deleted.
 *
 * The stack is the real `RootStackParamList` with a stub standing in for the Characters screen, so
 * navigating away and back is the same trip the app makes.
 */
import React from 'react';
import {Text} from 'react-native';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {CharacterRepository, CharacterSummary} from 'core/ports';
import type {Repositories} from 'infra/persistence/repositories';
import {HomeRoute, type RootStackParamList} from 'app/navigation/AppNavigator';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ThemeProvider} from 'app/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const summary = (over: Partial<CharacterSummary> = {}): CharacterSummary => ({
    id: 'c1',
    name: 'Defensor',
    player: 'Phil',
    edition: '6E',
    isActive: false,
    portraitUri: null,
    /** Unframed — reads as the centre crop every portrait got before framing existed. */
    portraitFocus: null,
    ...over,
});

const collectText = (node: unknown): string[] => {
    if (node === null || node === undefined) {
        return [];
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return [String(node)];
    }
    if (Array.isArray(node)) {
        return node.flatMap(collectText);
    }
    return collectText((node as {children?: unknown}).children);
};

const press = async (tree: ReactTestRenderer, testID: string): Promise<void> => {
    const target = tree.root.findAllByProps({testID}).find((node) => typeof node.props.onPress === 'function');

    await act(async () => {
        target?.props.onPress();
    });
    await act(async () => {});
};

/** Mounts the real HomeRoute at Home, with a stub at Characters that can pop back. */
const renderStack = async (recent: () => CharacterSummary[]): Promise<{tree: ReactTestRenderer; calls: () => number}> => {
    let calls = 0;
    const characters = {
        recent: async () => {
            calls += 1;
            return recent();
        },
    } as unknown as CharacterRepository;

    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <RepositoriesProvider repositories={{characters} as unknown as Repositories}>
                    <NavigationContainer>
                        <Stack.Navigator screenOptions={{headerShown: false}}>
                            <Stack.Screen name="Home">{({navigation}) => <HomeRoute navigation={navigation} />}</Stack.Screen>
                            <Stack.Screen name="CharacterList">
                                {({navigation}) => (
                                    <Text testID="go-back" onPress={() => navigation.goBack()}>
                                        Characters
                                    </Text>
                                )}
                            </Stack.Screen>
                        </Stack.Navigator>
                    </NavigationContainer>
                </RepositoriesProvider>
            </ThemeProvider>,
        );
    });
    await act(async () => {});

    return {tree, calls: () => calls};
};

describe('HomeRoute — reload on focus', () => {
    it('reloads Recent on the way back, so opening a character reorders it', async () => {
        // What the repository would return after Grond was opened: `recent` is ordered by
        // `accessed_at`, so opening a character rewrites the list Home is showing.
        let recent = [summary({id: 'c1', name: 'Defensor'}), summary({id: 'c2', name: 'Grond'})];
        const {tree} = await renderStack(() => recent);

        expect(collectText(tree.toJSON())).toContain('Defensor');

        await press(tree, 'tile-All Characters');
        recent = [summary({id: 'c2', name: 'Grond'}), summary({id: 'c1', name: 'Defensor'})];

        await press(tree, 'go-back');

        // Grond now leads. Before the focus refresh this still read Defensor-then-Grond for the
        // rest of the session.
        expect(collectText(tree.toJSON()).filter((text) => text === 'Defensor' || text === 'Grond')).toEqual(['Grond', 'Defensor']);
    });

    it('drops a character deleted while Home was parked', async () => {
        let recent = [summary({id: 'c1', name: 'Defensor'})];
        const {tree} = await renderStack(() => recent);

        await press(tree, 'tile-All Characters');
        recent = [];
        await press(tree, 'go-back');

        const text = collectText(tree.toJSON());
        expect(text).not.toContain('Defensor');
        expect(text).toContain('No characters yet');
    });

    it('loads once on launch — Home mounts already focused', async () => {
        // Home loads itself on mount, and useFocusEffect also fires on that first focus. Without
        // the skip, every launch would query twice.
        const {calls} = await renderStack(() => [summary()]);

        expect(calls()).toBe(1);
    });

    it('reloads once per return, not once per render', async () => {
        const {tree, calls} = await renderStack(() => [summary()]);

        await press(tree, 'tile-All Characters');
        await press(tree, 'go-back');
        expect(calls()).toBe(2);

        await press(tree, 'tile-All Characters');
        await press(tree, 'go-back');
        expect(calls()).toBe(3);
    });
});
