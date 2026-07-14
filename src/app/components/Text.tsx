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
import {Text as RNText, type TextProps as RNTextProps, type TextStyle} from 'react-native';
import {useTheme} from 'app/theme';

export type TextVariant = 'title' | 'subtitle' | 'body' | 'label' | 'caption';

export interface TextProps extends RNTextProps {
    variant?: TextVariant;
    muted?: boolean;
    color?: string;
}

const WEIGHT: Record<TextVariant, keyof ReturnType<typeof useTheme>['fontWeight']> = {
    title: 'semibold',
    subtitle: 'medium',
    body: 'regular',
    label: 'medium',
    caption: 'regular',
};

/** Themed text. `variant` picks size + weight; colour comes from the theme. */
export function Text({variant = 'body', muted = false, color, style, ...rest}: TextProps): React.JSX.Element {
    const theme = useTheme();

    const themed: TextStyle = {
        color: color ?? (muted ? theme.colors.textMuted : theme.colors.text),
        fontSize: theme.fontSize[variant],
        fontWeight: theme.fontWeight[WEIGHT[variant]],
    };

    return <RNText style={[themed, style]} {...rest} />;
}
