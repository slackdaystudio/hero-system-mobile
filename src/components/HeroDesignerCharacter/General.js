import React from 'react';
import {View, Text, Image} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Heading} from '../Heading/Heading';
import {common} from '../../lib/Common';
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

export const General = ({portrait, portraitWidth, portraitHeight, characterInfo}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    const _renderPortrait = () => {
        if (portrait === null || portrait === undefined) {
            return null;
        }

        return (
            <>
                <Heading text="Portrait" />
                <Image style={{width: portraitWidth, height: portraitHeight, alignSelf: 'center'}} source={{uri: portrait}} />
            </>
        );
    };

    return (
        <View>
            <Heading text="Information" />
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.boldGrey, {flex: 1}]}>Name:</Text>
                <Text style={[styles.grey, {flex: 3}]}>{characterInfo.characterName}</Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.boldGrey, {flex: 1}]}>Aliases:</Text>
                <Text style={[styles.grey, {flex: 3}]}>{characterInfo.alternateIdentities}</Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.boldGrey, {flex: 1}]}>Player:</Text>
                <Text style={[styles.grey, {flex: 3}]}>{characterInfo.playerName}</Text>
            </View>
            <View style={{paddingBottom: verticalScale(20)}} />
            {_renderPortrait()}
            <View style={{paddingBottom: verticalScale(20)}} />
            <Heading text="Traits" />
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.boldGrey, {flex: 1}]}>Height:</Text>
                <Text style={[styles.grey, {flex: 3}]}>{common.toCm(characterInfo.height)} cm</Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.boldGrey, {flex: 1}]}>Weight:</Text>
                <Text style={[styles.grey, {flex: 3}]}>{common.toKg(characterInfo.weight)} kg</Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.boldGrey, {flex: 1}]}>Eye Color:</Text>
                <Text style={[styles.grey, {flex: 3}]}>{characterInfo.eyeColor}</Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.boldGrey, {flex: 1}]}>Hair Color:</Text>
                <Text style={[styles.grey, {flex: 3}]}>{characterInfo.hairColor}</Text>
            </View>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Heading text="Background" />
            <Text style={styles.grey}>{characterInfo.background}</Text>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Heading text="personality" />
            <Text style={styles.grey}>{characterInfo.personality}</Text>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Heading text="Quote" />
            <Text style={styles.grey}>{characterInfo.quote}</Text>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Heading text="Tactics" />
            <Text style={styles.grey}>{characterInfo.tactics}</Text>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Heading text="Campaign Use" />
            <Text style={styles.grey}>{characterInfo.campaignUse}</Text>
            <View style={{paddingBottom: verticalScale(20)}} />
            <Heading text="Appearance" />
            <Text style={styles.grey}>{characterInfo.appearance}</Text>
            <View style={{paddingBottom: verticalScale(20)}} />
        </View>
    );
};
