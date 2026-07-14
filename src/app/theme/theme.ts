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
 * The design-system theme contract. Owned in-house (see docs — no third-party UI
 * kit): screens and components read only these tokens, never raw hex or magic
 * numbers, so a restyle is one file and a theme swap is one object.
 */
export type ResolvedScheme = 'light' | 'dark';

export interface ThemeColors {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    onPrimary: string;
    danger: string;
    active: string;
}

export interface Theme {
    scheme: ResolvedScheme;
    colors: ThemeColors;
    /** 4px grid: spacing(3) === 12. */
    spacing: (units: number) => number;
    radius: {sm: number; md: number; lg: number; pill: number};
    fontSize: {caption: number; label: number; body: number; subtitle: number; title: number};
    fontWeight: {regular: '400'; medium: '500'; semibold: '600'; bold: '700'};
}

const spacing = (units: number): number => units * 4;
const radius = {sm: 4, md: 8, lg: 12, pill: 999} as const;
const fontSize = {caption: 12, label: 13, body: 15, subtitle: 16, title: 22} as const;
const fontWeight = {regular: '400', medium: '500', semibold: '600', bold: '700'} as const;

export const darkTheme: Theme = {
    scheme: 'dark',
    colors: {
        background: '#1b1b1d',
        surface: '#242427',
        surfaceAlt: '#2e2e32',
        border: '#3a3a3f',
        text: '#e8e8e8',
        textMuted: '#8a8a8a',
        primary: '#d4442f',
        onPrimary: '#ffffff',
        danger: '#e5484d',
        active: '#3fb950',
    },
    spacing,
    radius,
    fontSize,
    fontWeight,
};

export const lightTheme: Theme = {
    scheme: 'light',
    colors: {
        background: '#f6f6f7',
        surface: '#ffffff',
        surfaceAlt: '#eeeef0',
        border: '#d8d8dc',
        text: '#1b1b1d',
        textMuted: '#6b6b70',
        primary: '#c23321',
        onPrimary: '#ffffff',
        danger: '#d4342b',
        active: '#1a7f37',
    },
    spacing,
    radius,
    fontSize,
    fontWeight,
};

export const themeFor = (scheme: ResolvedScheme): Theme => (scheme === 'dark' ? darkTheme : lightTheme);
