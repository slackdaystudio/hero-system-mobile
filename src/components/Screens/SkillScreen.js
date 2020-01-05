import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { NavigationEvents } from 'react-navigation';
import { BackHandler, StyleSheet, View, Image, Switch, Alert } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShake from 'react-native-shake';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import { updateFormValue } from '../../reducers/forms';

// Copyright 2020 Philip J. Guinchard
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
        skillForm: PropTypes.object.isRequired
    }

	constructor(props) {
		super(props);

        this.updateFormValue = this._updateFormValue.bind(this);
		this.roll = this._roll.bind(this);
	}

	onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

            return true;
        });

        RNShake.addEventListener('ShakeEvent', () => {
            this.roll();
        });
	}

   	onDidBlur() {
   		RNShake.removeEventListener('ShakeEvent');
   		this.backHandler.remove();
   	}

    _roll() {
        let threshold = this.props.skillForm.skillCheck ? this.props.skillForm.value + '-' : null;

        this.props.navigation.navigate('Result', {from: 'Skill', result: dieRoller.rollCheck(threshold)});
    }

    _updateFormValue(key, value) {
        if (key === 'value') {
            value = parseInt(value, 10);
        }

        this.props.updateFormValue('skill', key, value)
    }

    _renderSlider() {
        if (this.props.skillForm.skillCheck) {
            return (
                <Slider
					style={styles.switchStyle}
                    label='Skill Level:'
                    value={this.props.skillForm.value}
                    step={1}
                    min={-30}
                    max={30}
                    onValueChange={this.updateFormValue}
                    valueKey='value'
                />
            );
        }

        return null;
    }

	render() {
		return (
			<Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
			    <Header navigation={this.props.navigation} />
				<Content style={styles.content}>
				    <Text style={styles.heading}>Roll 3d6</Text>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
	              	    <Text style={styles.grey}>Is skill check?</Text>
		              	<View style={{paddingRight: 10}}>
		              		<Switch
								value={this.props.skillForm.skillCheck}
								onValueChange={() => this.updateFormValue('skillCheck', !this.props.skillCheck)}
								minimumTrackTintColor='#14354d'
								maximumTrackTintColor='#14354d'
								thumbTintColor='#14354d'
								onTintColor="#01121E"
							/>
		              	</View>
		            </View>
					{this._renderSlider()}
					<View style={styles.buttonContainer}>
                        <Button block style={styles.button}  onPress={this.roll}>
                            <Text uppercase={false}>Roll</Text>
                        </Button>
					</View>
				</Content>
			</Container>
		);
	}
}

const localStyles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 10
	},
	checkContainer: {
		paddingBottom: 20
	}
});

const mapStateToProps = state => {
    return {
        skillForm: state.forms.skill
    };
}

const mapDispatchToProps = {
    updateFormValue
}

export default connect(mapStateToProps, mapDispatchToProps)(SkillScreen);