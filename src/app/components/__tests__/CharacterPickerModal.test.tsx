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
import type {CharacterSummary} from 'core/ports';
import {ThemeProvider} from 'app/theme';
import {CharacterPickerModal, type CharacterPickerModalProps} from '../CharacterPickerModal';

const summary = (id: string): CharacterSummary => ({
    id,
    name: id.toUpperCase(),
    player: null,
    edition: '6E',
    isActive: false,
    portraitUri: null,
    portraitFocus: null,
});

const render = (over: Partial<CharacterPickerModalProps> = {}): ReactTestRenderer => {
    const props: CharacterPickerModalProps = {
        visible: true,
        characters: [summary('a'), summary('b')],
        canRemove: false,
        onPick: jest.fn(),
        onRemove: jest.fn(),
        onClose: jest.fn(),
        ...over,
    };
    let tree!: ReactTestRenderer;
    act(() => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <CharacterPickerModal {...props} />
            </ThemeProvider>,
        );
    });
    return tree;
};

const press = (tree: ReactTestRenderer, testID: string): void => {
    act(() => {
        tree.root
            .findAllByProps({testID})
            .find((n) => typeof n.props.onPress === 'function')
            ?.props.onPress();
    });
};

const exists = (tree: ReactTestRenderer, testID: string): boolean => tree.root.findAllByProps({testID}).length > 0;

describe('CharacterPickerModal', () => {
    it('lists the candidates it is given and pins the tapped one', () => {
        const onPick = jest.fn();
        const tree = render({characters: [summary('a'), summary('b')], onPick});

        expect(exists(tree, 'picker-row-a')).toBe(true);
        expect(exists(tree, 'picker-row-b')).toBe(true);

        press(tree, 'picker-row-b');
        expect(onPick).toHaveBeenCalledWith('b');
    });

    it('does not offer a character that is already pinned elsewhere — the caller filters it out', () => {
        // The host passes only unpinned candidates; the modal shows exactly what it's handed.
        const tree = render({characters: [summary('a')]});

        expect(exists(tree, 'picker-row-a')).toBe(true);
        expect(exists(tree, 'picker-row-b')).toBe(false);
    });

    it('offers Remove only when the slot already holds a pin', () => {
        expect(exists(render({canRemove: false}), 'picker-remove')).toBe(false);

        const onRemove = jest.fn();
        const removable = render({canRemove: true, onRemove});
        expect(exists(removable, 'picker-remove')).toBe(true);

        press(removable, 'picker-remove');
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('dismisses on the backdrop without choosing anything', () => {
        const onClose = jest.fn();
        const onPick = jest.fn();
        const tree = render({onClose, onPick});

        press(tree, 'picker-backdrop');
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onPick).not.toHaveBeenCalled();
    });

    it('shows an empty state when there is nothing left to pin', () => {
        const tree = render({characters: []});
        const text = tree.root.findAllByProps({}).flatMap((n) => (typeof n.props.children === 'string' ? [n.props.children] : []));
        expect(text.join(' ')).toContain('No other characters');
    });
});
