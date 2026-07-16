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
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import {Text} from 'app/components';
import {ThemeProvider} from 'app/theme';
import {ToastProvider, useToast} from '../ToastProvider';

const collectText = (node: unknown): string[] => {
    if (node === null || node === undefined) {
        return [];
    }
    if (typeof node === 'string') {
        return [node];
    }
    if (Array.isArray(node)) {
        return node.flatMap(collectText);
    }
    return collectText((node as {children?: unknown}).children);
};

/** A child that shows a toast on demand via the hook. */
function Trigger({message}: {message: string}): React.JSX.Element {
    const {showToast} = useToast();
    return <Text testID="trigger" onPress={() => showToast(message, 'warning')} />;
}

const render = async (): Promise<ReactTestRenderer> => {
    let tree!: ReactTestRenderer;
    await act(async () => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <ToastProvider>
                    <Trigger message="Endurance low — 8 / 40" />
                </ToastProvider>
            </ThemeProvider>,
        );
    });
    return tree;
};

describe('ToastProvider', () => {
    it('shows a toast on demand and dismisses it on tap', async () => {
        const tree = await render();
        expect(collectText(tree.toJSON()).some((t) => t.includes('Endurance low'))).toBe(false);

        const trigger = tree.root.findAllByProps({testID: 'trigger'}).find((n) => typeof n.props.onPress === 'function');
        await act(async () => {
            trigger?.props.onPress();
        });
        expect(collectText(tree.toJSON()).some((t) => t.includes('Endurance low — 8 / 40'))).toBe(true);

        const toast = tree.root.findAllByProps({testID: 'toast'}).find((n) => typeof n.props.onPress === 'function');
        await act(async () => {
            toast?.props.onPress();
        });
        expect(collectText(tree.toJSON()).some((t) => t.includes('Endurance low'))).toBe(false);
    });
});
