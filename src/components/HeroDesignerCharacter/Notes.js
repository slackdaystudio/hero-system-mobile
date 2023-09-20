import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import {ImageBackground, View} from 'react-native';
import {Textarea} from 'native-base';
import {scale, verticalScale} from 'react-native-size-matters';
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

export default class Notes extends Component {
    static propTypes = {
        notes: PropTypes.string,
        updateNotes: PropTypes.func.isRequired,
    };

    render() {
        return (
            <>
                <ImageBackground
                    source={require('../../../public/background.png')}
                    style={{flex: 1, flexDirection: 'column'}}
                    imageStyle={{resizeMode: 'repeat'}}
                >
                    <View style={{paddingHorizontal: scale(5), paddingBottom: verticalScale(20)}}>
                        <Textarea
                            rowSpan={15}
                            maxLength={10000}
                            bordered
                            placeholder="Campaign notes, miscellaneous equipment, etc"
                            style={[styles.grey, {backgroundColor: '#121212', borderColor: '#303030', fontSize: verticalScale(14)}]}
                            defaultValue={this.props.notes}
                            onEndEditing={(event) => this.props.updateNotes(event.nativeEvent.text)}
                        />
                    </View>
                </ImageBackground>
            </>
        );
    }
}
