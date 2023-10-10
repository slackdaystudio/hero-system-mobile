import React from 'react';
import PropTypes from 'prop-types';
import {View, Text} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {CircleButton} from '../CircleButton';
import {Icon} from '../Icon/Icon';
import {styles, TEXT_COLOR} from '../../Styles';

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

export const FooterButton = ({label, iconName, onPress, onLongPress, circular}) => {
    return (
        <View alignItems="center" justifyItems="center">
            <CircleButton
                name={<Icon solid minWidth={scale(18)} textAlign="center" color={TEXT_COLOR} name={iconName} />}
                onPress={onPress}
                onLongPress={onLongPress}
            />
            {label ? <Text style={[styles.text, {fontSize: verticalScale(10)}]}>{label}</Text> : null}
        </View>
    );
};

FooterButton.propTypes = {
    label: PropTypes.string,
    iconName: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired,
    onLongPress: PropTypes.func,
    circular: PropTypes.bool,
};

FooterButton.defaultProps = {
    circular: false,
};
