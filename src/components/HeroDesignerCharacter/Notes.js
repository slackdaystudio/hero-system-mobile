import React from 'react';
import {TextInput, View} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

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

export const Notes = ({notes, updateNotes}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    return (
        <>
            <View style={{alignItems: 'center', paddingHorizontal: scale(5), paddingVertical: verticalScale(20)}}>
                <TextInput
                    multiline={true}
                    placeholder="Campaign notes, miscellaneous equipment, etc"
                    placeholderTextColor="rgba(232, 232, 232, 0.3)"
                    style={styles.textAreaInput}
                    height={verticalScale(250)}
                    width="95%"
                    defaultValue={notes.toString()}
                    onEndEditing={(event) => {
                        event.preventDefault();

                        updateNotes(event.nativeEvent.text);
                    }}
                />
            </View>
        </>
    );
};
