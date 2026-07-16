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
import TestRenderer, {act} from 'react-test-renderer';
import {Text} from 'app/components';
import {ThemeProvider} from 'app/theme';
import {SpendChip} from '../SpendChip';

describe('SpendChip', () => {
    it('spends on tap (the flash is visual; the wiring is what we can assert)', async () => {
        const onSpend = jest.fn();
        let tree!: TestRenderer.ReactTestRenderer;
        await act(async () => {
            tree = TestRenderer.create(
                <ThemeProvider colorScheme="dark">
                    <SpendChip testID="chip" onSpend={onSpend}>
                        <Text>END 6</Text>
                    </SpendChip>
                </ThemeProvider>,
            );
        });

        const chip = tree.root.findAllByProps({testID: 'chip'}).find((n) => typeof n.props.onPress === 'function');
        await act(async () => {
            chip?.props.onPress();
        });

        expect(onSpend).toHaveBeenCalledTimes(1);
        await act(async () => {
            tree.unmount();
        });
    });
});
