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

import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {Screen, Text} from 'app/components';
import {createDeviceRepositories} from 'app/composition/deviceRepositories';
import {AppNavigator} from 'app/navigation/AppNavigator';
import {AuthoringProvider} from 'app/providers/AuthoringProvider';
import {DiceProvider} from 'app/providers/DiceProvider';
import {GenerateProvider} from 'app/providers/GenerateProvider';
import {ImportProvider} from 'app/providers/ImportProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {SettingsProvider, useSettings} from 'app/providers/SettingsProvider';
import {ToastProvider} from 'app/providers/ToastProvider';
import {ThemeProvider} from 'app/theme';
import {createDocumentPickerFilePicker} from 'infra/files/documentPickerFilePicker';
import {nativeFileSystem} from 'infra/files/nativeFileSystem';
import type {Repositories} from 'infra/persistence/repositories';

// The device document-picker, wired once. Injected via ImportProvider so screens
// depend only on the FilePicker port (tests supply a fake).
const filePicker = createDocumentPickerFilePicker(nativeFileSystem());

type Boot = {status: 'loading'} | {status: 'ready'; repositories: Repositories} | {status: 'error'; message: string};

/**
 * App entry: bootstrap the on-device composition root (open the DB, migrate, wire
 * repositories), then render the character list inside its providers. Theming
 * wraps everything so the loading and error states are on-brand too.
 */
function App(): React.JSX.Element {
    const [boot, setBoot] = useState<Boot>({status: 'loading'});

    useEffect(() => {
        let cancelled = false;

        createDeviceRepositories()
            .then((repositories) => {
                if (!cancelled) {
                    setBoot({status: 'ready', repositories});
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setBoot({status: 'error', message: error instanceof Error ? error.message : String(error)});
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (boot.status !== 'ready') {
        // Boot states are themed with the default (system) scheme — settings
        // aren't loaded yet.
        return (
            <ThemeProvider>
                <Screen style={styles.centered}>
                    {boot.status === 'loading' ? <ActivityIndicator /> : <Text muted>{boot.message}</Text>}
                </Screen>
            </ThemeProvider>
        );
    }

    return (
        <RepositoriesProvider repositories={boot.repositories}>
            <SettingsProvider>
                <ThemedApp />
            </SettingsProvider>
        </RepositoriesProvider>
    );
}

/**
 * The themed app tree. Lives under {@link SettingsProvider} so the theme can
 * follow the persisted colour-scheme setting live — changing it in Settings
 * re-themes everything immediately.
 */
function ThemedApp(): React.JSX.Element {
    const {settings} = useSettings();

    return (
        <ThemeProvider colorScheme={settings.colorScheme} fontScale={settings.fontScale}>
            <ToastProvider>
                <ImportProvider filePicker={filePicker}>
                    <GenerateProvider>
                        <AuthoringProvider>
                            <DiceProvider>
                                <AppNavigator />
                            </DiceProvider>
                        </AuthoringProvider>
                    </GenerateProvider>
                </ImportProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default App;
