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

import {darkTheme, lightTheme, themeFor} from '../theme';

describe('themeFor', () => {
    it('returns the base theme at scale 1', () => {
        expect(themeFor('dark')).toBe(darkTheme);
        expect(themeFor('light', 1)).toBe(lightTheme);
    });

    it('scales every font size by the factor, rounding to whole pixels', () => {
        const scaled = themeFor('dark', 1.5);

        expect(scaled.fontSize.body).toBe(Math.round(darkTheme.fontSize.body * 1.5));
        expect(scaled.fontSize.title).toBe(Math.round(darkTheme.fontSize.title * 1.5));
        expect(scaled.fontSize.caption).toBe(Math.round(darkTheme.fontSize.caption * 1.5));
    });

    it('leaves colours and other tokens untouched when scaling', () => {
        const scaled = themeFor('light', 1.3);

        expect(scaled.colors).toEqual(lightTheme.colors);
        expect(scaled.radius).toEqual(lightTheme.radius);
    });
});
