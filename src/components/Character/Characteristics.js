import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, TouchableHighlight} from 'react-native';
import {Text} from 'native-base';
import {scale, verticalScale} from 'react-native-size-matters';
import {character} from '../../lib/Character';
import {dieRoller} from '../../lib/DieRoller';
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

function initCharacteristicsShow(characteristics) {
    let showFullTexts = [];

    if (characteristics.length >= 1) {
        for (let i = 0; i < characteristics.length; i++) {
            showFullTexts.push(false);
        }
    }

    return showFullTexts;
}

export default class Characteristics extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        characteristics: PropTypes.array.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            showFullTexts: initCharacteristicsShow(props.characteristics),
            items: props.characteristics,
        };

        this.rollCheck = this._rollCheck.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (!common.isArrayEqual(prevState.items, nextProps.characteristics)) {
            let newState = {...prevState};

            newState.showFullTexts = initCharacteristicsShow(nextProps.characteristics);
            newState.items = nextProps.characteristics;

            return newState;
        }

        return null;
    }

    _rollCheck(threshold) {
        if (threshold !== '') {
            this.props.navigation.navigate('Result', {from: 'ViewCharacter', result: dieRoller.rollCheck(threshold)});
        }
    }

    _getShortName(fullName) {
        if (fullName.length === 4) {
            return fullName.toUpperCase();
        } else if (fullName === 'speed') {
            return 'SPD';
        } else {
            return fullName.slice(0, 3).toUpperCase();
        }
    }

    _toggleNotes(index) {
        let showFullTexts = this.state.showFullTexts;
        showFullTexts[index] = !showFullTexts[index];

        this.setState({showFullTexts: showFullTexts});
    }

    _renderNotes(notes, index) {
        if (this.state.showFullTexts[index] && notes !== '') {
            return (
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignSelf: 'flex-start', paddingBottom: verticalScale(5)}}>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={styles.grey} />
                    </View>
                    <View style={{flex: 3, justifyContent: 'flex-start'}}>
                        <Text style={[styles.grey, {fontStyle: 'italic'}]}>{notes}</Text>
                    </View>
                </View>
            );
        }

        return null;
    }

    render() {
        let ignoredCharacteristics = ['comeliness'];

        if (character.isFifthEdition(this.props.characteristics)) {
            ignoredCharacteristics = ['ocv', 'dcv', 'omcv', 'dmcv'];
        }

        return (
            <View style={{paddingBottom: verticalScale(20), paddingHorizontal: scale(10)}}>
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: verticalScale(5)}}>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Val</Text>
                    </View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Char</Text>
                    </View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Pts</Text>
                    </View>
                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                        <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Roll</Text>
                    </View>
                </View>
                {this.props.characteristics.map((characteristic, index) => {
                    if (ignoredCharacteristics.indexOf(characteristic.name) !== -1) {
                        return null;
                    }

                    return (
                        <TouchableHighlight
                            key={'characteristic-' + index}
                            underlayColor="#3da0ff"
                            onPress={() => this._toggleNotes(index)}
                            onLongPress={() => this.rollCheck(characteristic.roll)}
                        >
                            <View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: verticalScale(5)}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>{characteristic.total}</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>{this._getShortName(characteristic.name)}</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>{characteristic.cost}</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>{characteristic.roll}</Text>
                                    </View>
                                </View>
                                {this._renderNotes(characteristic.notes, index)}
                            </View>
                        </TouchableHighlight>
                    );
                })}
            </View>
        );
    }
}
