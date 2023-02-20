import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {View, Switch} from 'react-native';
import {Container, Content, Button, Text} from 'native-base';
import {ScaledSheet, scale} from 'react-native-size-matters';
import RNShake from 'react-native-shake';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import {dieRoller} from '../../lib/DieRoller';
import styles from '../../Styles';
import {updateFormValue} from '../../reducers/forms';

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

class SkillScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        skillForm: PropTypes.object.isRequired,
        skillCheck: PropTypes.bool,
        updateFormValue: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.updateFormValue = this._updateFormValue.bind(this);
        this.roll = this._roll.bind(this);
    }

    componentDidMount() {
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            RNShake.addListener('ShakeEvent', () => {
                this.roll();
            });
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
        RNShake.removeEventListener('ShakeEvent');
    }

    _roll() {
        let threshold = this.props.skillForm.skillCheck ? this.props.skillForm.value + '-' : null;

        this.props.navigation.navigate('Result', {from: 'Skill', result: dieRoller.rollCheck(threshold)});
    }

    _updateFormValue(key, value) {
        if (key === 'value') {
            value = parseInt(value, 10);
        }

        this.props.updateFormValue('skill', key, value);
    }

    _renderSlider() {
        if (this.props.skillForm.skillCheck) {
            return (
                <Slider
                    style={styles.switchStyle}
                    label="Skill Level:"
                    value={this.props.skillForm.value}
                    step={1}
                    min={-30}
                    max={30}
                    onValueChange={this.updateFormValue}
                    valueKey="value"
                />
            );
        }

        return null;
    }

    render() {
        return (
            <Container style={styles.container}>
                <Header navigation={this.props.navigation} />
                <Content style={styles.content}>
                    <Text style={styles.heading}>Roll 3d6</Text>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                        <Text style={styles.grey}>Is skill check?</Text>
                        <View style={{paddingRight: scale(10)}}>
                            <Switch
                                value={this.props.skillForm.skillCheck}
                                onValueChange={() => this.updateFormValue('skillCheck', !this.props.skillForm.skillCheck)}
                                minimumTrackTintColor="#14354d"
                                maximumTrackTintColor="#14354d"
                                thumbColor="#14354d"
                                trackColor={{false: '#000', true: '#3d5478'}}
                                ios_backgroundColor="#3d5478"
                            />
                        </View>
                    </View>
                    {this._renderSlider()}
                    <View style={styles.buttonContainer}>
                        <Button block style={styles.button} onPress={this.roll}>
                            <Text uppercase={false}>Roll</Text>
                        </Button>
                    </View>
                </Content>
            </Container>
        );
    }
}

const localStyles = ScaledSheet.create({
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '10@vs',
    },
    checkContainer: {
        paddingBottom: '20@vs',
    },
});

const mapStateToProps = (state) => {
    return {
        skillForm: state.forms.skill,
    };
};

const mapDispatchToProps = {
    updateFormValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(SkillScreen);
