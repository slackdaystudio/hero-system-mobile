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
 * Any-number-of-many. The shape neither SelectField nor SegmentedControl covers, and the one whose
 * absence made a whole class of trait unbuildable — see `AuthorTraitScreen`.
 */
import React from 'react';
import TestRenderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import {ThemeProvider} from 'app/theme';
import {ToggleList, type ToggleItem} from '../ToggleList';

const item = (key: string, cost: number, selected = false): ToggleItem => ({key, label: key.toLowerCase(), cost, selected});

const render = (items: ToggleItem[], onToggle = jest.fn()): {tree: ReactTestRenderer; onToggle: jest.Mock} => {
    let tree!: ReactTestRenderer;
    act(() => {
        tree = TestRenderer.create(
            <ThemeProvider colorScheme="dark">
                <ToggleList label="OPTIONS" items={items} onToggle={onToggle} testID="toggles" />
            </ThemeProvider>,
        );
    });

    return {tree, onToggle};
};

const press = (tree: ReactTestRenderer, testID: string): void => {
    act(() => {
        tree.root
            .findAllByProps({testID})
            .find((node) => typeof node.props.onPress === 'function')
            ?.props.onPress();
    });
};

const textOf = (tree: ReactTestRenderer, testID: string): string =>
    tree.root
        .findAllByProps({testID})
        .flatMap((node) => node.findAllByType('Text' as never))
        .flatMap((node) => (Array.isArray(node.props.children) ? node.props.children : [node.props.children]))
        .filter((child) => typeof child === 'string' || typeof child === 'number')
        .join(' ');

describe('ToggleList', () => {
    it('reports the new state, so a second tap drops what the first took', () => {
        const {tree, onToggle} = render([item('AXES', 1), item('BLADES', 1, true)]);

        press(tree, 'toggles-AXES');
        expect(onToggle).toHaveBeenLastCalledWith('AXES', true);

        press(tree, 'toggles-BLADES');
        expect(onToggle).toHaveBeenLastCalledWith('BLADES', false);
    });

    it('prices each chip, because the meter alone makes that a subtraction', () => {
        const {tree} = render([item('AXES', 2), item('PENALTY', -1)]);

        expect(textOf(tree, 'toggles-AXES')).toContain('+2');
        expect(textOf(tree, 'toggles-PENALTY')).toContain('-1');
    });

    it('says nothing rather than "+0" for a free one', () => {
        // Several adders are group headers worth nothing on their own; a price on those is noise.
        const rendered = textOf(render([item('GROUP', 0)]).tree, 'toggles-GROUP');

        expect(rendered).toContain('group');
        expect(rendered).not.toContain('0');
    });

    it('is a checkbox to a screen reader, checked when it is taken', () => {
        const {tree} = render([item('AXES', 1, true), item('BLADES', 1)]);

        const state = (testID: string): unknown => tree.root.findAllByProps({testID}).find((node) => node.props.accessibilityRole === 'checkbox')?.props.accessibilityState;

        expect(state('toggles-AXES')).toEqual({checked: true});
        expect(state('toggles-BLADES')).toEqual({checked: false});
    });
});
