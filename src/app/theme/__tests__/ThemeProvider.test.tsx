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
import {Text as RNText} from 'react-native';
import TestRenderer, {act} from 'react-test-renderer';
import {ThemeProvider, useTheme} from '../index';
import {darkTheme, lightTheme} from '../theme';

const Probe = (): React.JSX.Element => {
    const theme = useTheme();
    return <RNText>{`${theme.scheme}:${theme.colors.background}`}</RNText>;
};

const renderProbe = async (colorScheme: 'system' | 'light' | 'dark'): Promise<string> => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme={colorScheme}>
                <Probe />
            </ThemeProvider>,
        );
    });

    return (tree.root.findByType(RNText).props.children as string);
};

describe('ThemeProvider', () => {
    it('resolves an explicit light scheme to the light theme', async () => {
        expect(await renderProbe('light')).toBe(`light:${lightTheme.colors.background}`);
    });

    it('resolves an explicit dark scheme to the dark theme', async () => {
        expect(await renderProbe('dark')).toBe(`dark:${darkTheme.colors.background}`);
    });

    it('throws when useTheme is used outside a provider', async () => {
        // React surfaces render errors through an error boundary rather than
        // rethrowing from create(), so catch it there.
        let captured = '';
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await act(async () => {
            TestRenderer.create(
                <ErrorBoundary onCatch={(message) => (captured = message)}>
                    <Probe />
                </ErrorBoundary>,
            );
        });

        spy.mockRestore();
        expect(captured).toContain('useTheme must be used within a ThemeProvider');
    });
});

class ErrorBoundary extends React.Component<{onCatch: (message: string) => void; children: React.ReactNode}, {failed: boolean}> {
    state = {failed: false};

    static getDerivedStateFromError(): {failed: boolean} {
        return {failed: true};
    }

    componentDidCatch(error: Error): void {
        this.props.onCatch(error.message);
    }

    render(): React.ReactNode {
        return this.state.failed ? null : this.props.children;
    }
}
