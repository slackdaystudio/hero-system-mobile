import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {View, Image} from 'react-native';
import {Text} from 'native-base';
import {verticalScale} from 'react-native-size-matters';
import Heading from '../Heading/Heading';
import {common} from '../../lib/Common';
import styles from '../../Styles';

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

export default class General extends Component {
    static propTypes = {
        characterInfo: PropTypes.object.isRequired,
        portrait: PropTypes.string,
        portraitWidth: PropTypes.number,
        portraitHeight: PropTypes.number,
    };

    _renderPortrait() {
        if (this.props.portrait === null || this.props.portrait === undefined) {
            return null;
        }

        return (
            <Fragment>
                <Heading text="Portrait" />
                <Image style={{width: this.props.portraitWidth, height: this.props.portraitHeight, alignSelf: 'center'}} source={{uri: this.props.portrait}} />
            </Fragment>
        );
    }

    render() {
        return (
            <View>
                <Heading text="Information" />
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Name:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.characterName}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Aliases:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.alternateIdentities}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Player:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.playerName}</Text>
                </View>
                <View style={{paddingBottom: verticalScale(20)}} />
                {this._renderPortrait()}
                <View style={{paddingBottom: verticalScale(20)}} />
                <Heading text="Traits" />
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Height:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{common.toCm(this.props.characterInfo.height)} cm</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Weight:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{common.toKg(this.props.characterInfo.weight)} kg</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Eye Color:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.eyeColor}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Hair Color:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.hairColor}</Text>
                </View>
                <View style={{paddingBottom: verticalScale(20)}} />
                <Heading text="Background" />
                <Text style={styles.grey}>{this.props.characterInfo.background}</Text>
                <View style={{paddingBottom: verticalScale(20)}} />
                <Heading text="personality" />
                <Text style={styles.grey}>{this.props.characterInfo.personality}</Text>
                <View style={{paddingBottom: verticalScale(20)}} />
                <Heading text="Quote" />
                <Text style={styles.grey}>{this.props.characterInfo.quote}</Text>
                <View style={{paddingBottom: verticalScale(20)}} />
                <Heading text="Tactics" />
                <Text style={styles.grey}>{this.props.characterInfo.tactics}</Text>
                <View style={{paddingBottom: verticalScale(20)}} />
                <Heading text="Campaign Use" />
                <Text style={styles.grey}>{this.props.characterInfo.campaignUse}</Text>
                <View style={{paddingBottom: verticalScale(20)}} />
                <Heading text="Appearance" />
                <Text style={styles.grey}>{this.props.characterInfo.appearance}</Text>
                <View style={{paddingBottom: verticalScale(20)}} />
            </View>
        );
    }
}
