import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShake from 'react-native-shake';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import { updateFormValue } from '../../reducers/forms';

class FreeFormScreen extends Component {
	constructor(props) {
		super(props);

		this.setSliderState = this._setSliderState.bind(this);
		this.roll = this._roll.bind(this);
	}
	
	componentDidMount() {
        RNShake.addEventListener('ShakeEvent', () => {
            this.roll();
        });
	}

   	componentWillUnmount() {
   		RNShake.removeEventListener('ShakeEvent');
   	}

    _roll() {
        this.props.navigation.navigate('Result', dieRoller.freeFormRoll(this.props.freeFormForm.dice, this.props.freeFormForm.halfDice, this.props.freeFormForm.pips));
    }

	_setSliderState(key, value) {
		this.props.updateFormValue('freeForm', key, parseInt(value, 10));
	}
	
	render() {
		return (
			<Container style={styles.container}>
				<Header navigation={this.props.navigation} />
				<Content style={styles.content}>
				    <Text style={styles.heading}>Free Form Roll</Text>
					<Slider 
						label='Dice:'
						value={this.props.freeFormForm.dice}
						step={1} 
						min={0} 
						max={50}
						onValueChange={this.setSliderState}
						valueKey='dice' />
					<Slider 
						label='Half Dice:'
						value={this.props.freeFormForm.halfDice}
						step={1} 
						min={0} 
						max={50}
						onValueChange={this.setSliderState}
						valueKey='halfDice' />
					<Slider 
						label='Pips:'
						value={this.props.freeFormForm.pips}
						step={1} 
						min={-50}
						max={50}
						onValueChange={this.setSliderState}
						valueKey='pips' />
					<Button block style={styles.button}  onPress={this.roll}>
						<Text uppercase={false}>Roll</Text>
					</Button>
				</Content>
			</Container>
		);
	}
}

const mapStateToProps = state => {
    return {
        freeFormForm: state.forms.freeForm
    };
}

const mapDispatchToProps = {
    updateFormValue
}

export default connect(mapStateToProps, mapDispatchToProps)(FreeFormScreen);