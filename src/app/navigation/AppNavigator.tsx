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
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {CharacterDetailScreen} from 'app/screens/CharacterDetailScreen';
import {CharacterListScreen} from 'app/screens/CharacterListScreen';
import {useTheme} from 'app/theme';

/**
 * The only file that knows about react-navigation. Screens stay pure and
 * props-driven (and so testable without a navigation container); this navigator
 * is the single seam that wires them into a themed native stack.
 */
export type RootStackParamList = {
    CharacterList: undefined;
    CharacterDetail: {id: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(): React.JSX.Element {
    const theme = useTheme();

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: {backgroundColor: theme.colors.surface},
                        headerTintColor: theme.colors.text,
                        contentStyle: {backgroundColor: theme.colors.background},
                    }}>
                    <Stack.Screen name="CharacterList" options={{title: 'Characters'}}>
                        {({navigation}) => <CharacterListScreen onSelect={(id) => navigation.navigate('CharacterDetail', {id})} />}
                    </Stack.Screen>
                    <Stack.Screen name="CharacterDetail" options={{title: ''}}>
                        {({route, navigation}) => (
                            <CharacterDetailScreen characterId={route.params.id} onReady={(character) => navigation.setOptions({title: character.name})} />
                        )}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
