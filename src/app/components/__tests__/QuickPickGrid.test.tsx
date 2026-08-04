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
import {QuickPickGrid} from '../QuickPickGrid';
import type {Slot} from '../quickPick/slots';

const summary = (over: Partial<CharacterSummary> & {id: string}): CharacterSummary => ({
    name: over.id.toUpperCase(),
    player: null,
    edition: '6E',
    isActive: false,
    portraitUri: null,
    portraitFocus: null,
    ...over,
});

const slot = (position: number, kind: Slot['kind'], character: CharacterSummary | null): Slot => ({position, kind, character});

const render = (slots: Slot[], handlers: {onActivate?: (id: string) => void; onEditSlot?: (position: number) => void} = {}): ReactTestRenderer => {
    let tree!: ReactTestRenderer;
    act(() => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <QuickPickGrid slots={slots} onActivate={handlers.onActivate ?? jest.fn()} onEditSlot={handlers.onEditSlot ?? jest.fn()} />
            </ThemeProvider>,
        );
    });
    return tree;
};

const node = (tree: ReactTestRenderer, testID: string, has: 'onPress' | 'onLongPress') =>
    tree.root.findAllByProps({testID}).find((n) => typeof n.props[has] === 'function');

const exists = (tree: ReactTestRenderer, testID: string): boolean => tree.root.findAllByProps({testID}).length > 0;

describe('QuickPickGrid', () => {
    it('activates the character under a tapped tile — never the wrong one', () => {
        const onActivate = jest.fn();
        const slots = [slot(0, 'pinned', summary({id: 'a'})), slot(1, 'suggested', summary({id: 'b'})), slot(2, 'empty', null)];
        const tree = render(slots, {onActivate});

        act(() => node(tree, 'quickpick-slot-1', 'onPress')?.props.onPress());
        expect(onActivate).toHaveBeenCalledWith('b');
    });

    it('tapping is activate, not pin — a suggestion opens without being committed', () => {
        const onActivate = jest.fn();
        const onEditSlot = jest.fn();
        const tree = render([slot(0, 'suggested', summary({id: 'b'}))], {onActivate, onEditSlot});

        act(() => node(tree, 'quickpick-slot-0', 'onPress')?.props.onPress());

        expect(onActivate).toHaveBeenCalledWith('b');
        expect(onEditSlot).not.toHaveBeenCalled();
    });

    it('long-press curates the slot at its position', () => {
        const onEditSlot = jest.fn();
        const slots = [slot(0, 'pinned', summary({id: 'a'})), slot(1, 'empty', null)];
        const tree = render(slots, {onEditSlot});

        act(() => node(tree, 'quickpick-slot-1', 'onLongPress')?.props.onLongPress());
        expect(onEditSlot).toHaveBeenCalledWith(1);
    });

    it('an empty tile has no tap action but can still be long-pressed to add', () => {
        const onActivate = jest.fn();
        const onEditSlot = jest.fn();
        const tree = render([slot(0, 'empty', null)], {onActivate, onEditSlot});

        // No onPress handler at all on an empty tile.
        expect(node(tree, 'quickpick-slot-0', 'onPress')).toBeUndefined();
        act(() => node(tree, 'quickpick-slot-0', 'onLongPress')?.props.onLongPress());
        expect(onEditSlot).toHaveBeenCalledWith(0);
        expect(onActivate).not.toHaveBeenCalled();
    });

    it('marks pinned tiles, and only pinned tiles', () => {
        const slots = [slot(0, 'pinned', summary({id: 'a'})), slot(1, 'suggested', summary({id: 'b'}))];
        const tree = render(slots);

        expect(exists(tree, 'quickpick-pinned-0')).toBe(true);
        expect(exists(tree, 'quickpick-pinned-1')).toBe(false);
    });

    it('rings the active character', () => {
        const slots = [slot(0, 'pinned', summary({id: 'a'})), slot(1, 'pinned', summary({id: 'b', isActive: true}))];
        const tree = render(slots);

        expect(exists(tree, 'quickpick-active-0')).toBe(false);
        expect(exists(tree, 'quickpick-active-1')).toBe(true);
    });
});
