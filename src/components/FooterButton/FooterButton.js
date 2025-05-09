import React from 'react';
import {View, Text} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {CircleButton} from '../CircleButton/CircleButton';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

// Copyright (C) Slack Day Studio - All Rights Reserved
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

export const FooterButton = ({label, iconName, onPress, onLongPress}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    return (
        <View alignItems="center" justifyItems="center">
            <CircleButton name={iconName} size={verticalScale(30)} fontSize={verticalScale(12)} onPress={onPress} onLongPress={onLongPress} />
            {label ? <Text style={styles.grey}>{label}</Text> : null}
        </View>
    );
};
