import React, { Component }  from 'react';
import { StyleSheet, View, Keyboard, Alert } from 'react-native';
import { Text, Icon, Item, Input } from 'native-base';
import Slider from 'react-native-slider';
import { common } from '../../lib/Common';
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

class MySlider extends Component {
	constructor(props) {
		super(props);

        this.state = {
            textValue: props.value
        }

        this.onTextValueChange = this._onTextValueChange.bind(this);
		this.onValueChange = this._onValueChange.bind(this);
        this.keyboardDidHide = this._keyboardDidHide.bind(this);

		this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
	}

    componentWillReceiveProps(nextProps) {
        if (this.props !== nextProps) {
            if (this.state.textValue !== '' && this.state.textValue !== '-') {
                this.setState({textValue: nextProps.value});
            }
        }
    }

    _keyboardDidHide () {
        if (this.state.textValue !== this.props.value) {
            this.setState({textValue: this.props.value});
        }
    }

    _isFraction() {
        return this.props.step < 1;
    }

    _isInputValid(value) {
        if (value === '' || value === '-') {
            this.setState({textValue: value}, () => {
                this.onValueChange(0);
            });

            return false;
        }

        if (this._isFraction()) {
            this.setState({textValue: value});

            if (/^(\-)?[0-9]\.(25|50|75|0)$/.test(value) === false) {
                return false;
            }
        } else {
            if (/^(\-)?[0-9]*$/.test(value) === false) {
                return false;
            }
        }

        return true;
    }

    _onTextValueChange(value) {
        if (this._isInputValid(value) && value % this.props.step === 0.0) {
            if (value < this.props.min) {
                value = this.props.min;
            } else if (value > this.props.max) {
                value = this.props.max;
            }

            this.setState({textValue: value}, () => {
                this.onValueChange(value);
            });
        }
    }

	_onValueChange(value) {
        if (typeof this.props.valueKey === 'string') {
            this.props.onValueChange(this.props.valueKey, value);
        } else {
            this.props.onValueChange(value);
        }
	}

	render() {
		return (
			<View>
				<View style={localStyles.titleContainer}>
					<Text style={styles.grey}>{this.props.label}</Text>
                    <View style={{width: (this._isFraction() ? 50: 40)}}>
                        <Item>
                            <Input
                                style={styles.grey}
                                keyboardType='numeric'
                                maxLength={(this._isFraction() ? 5 : 3)}
                                value={this.state.textValue.toString()}
                                onChangeText={(value) => this.onTextValueChange(value)}
                            />
                        </Item>
                    </View>
				</View>
				<View>
                    <Slider
                        value={this.props.value}
                        step={this.props.step}
                        minimumValue={this.props.min}
                        maximumValue={this.props.max}
                        onValueChange={(value) => this.onValueChange(value)}
                        onSlidingStart={() => this.props.toggleTabsLocked(true)}
                        onSlidingComplete={() => this.props.toggleTabsLocked(false)}
                        disabled={this.props.disabled}
                        trackStyle={thumbStyles.track}
                        thumbStyle={thumbStyles.thumb}
                        minimumTrackTintColor='#14354d'
                    />
				</View>
			</View>
		);
	}
}

MySlider.defaultProps = {
    toggleTabsLocked: () => {}
};

const localStyles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 10
	},
});

const thumbStyles = StyleSheet.create({
	track: {
		height: 16,
		borderRadius: 10,
		backgroundColor: '#01121E',
		borderColor: '#062134',
		borderWidth: 1
	},
	thumb: {
		width: 30,
		height: 30,
		borderRadius: 30 / 2,
		backgroundColor: '#14354d',
		borderColor: '#062134',
		borderWidth: 2,
	}
});

export default MySlider;
