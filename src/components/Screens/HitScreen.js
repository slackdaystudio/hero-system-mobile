import React, { Component }  from 'react';
import { StyleSheet, View, Switch, AsyncStorage, Alert } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShakeEvent from 'react-native-shake-event';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';

export default class HitScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			ocv: 0,
			isAutofire: false,
			targetDcv: 0
		}
		
		this.updateCv = this._updateCv.bind(this);
		this.toggleAutofire = this._toggleAutofire.bind(this);
		this.roll = this._roll.bind(this);
	}

	componentDidMount() {
	    AsyncStorage.getItem('ocvSliderValue').then((ocvSliderValue) => {
	        if (ocvSliderValue !== undefined) {
	            if (common.compare(this.state, JSON.parse(ocvSliderValue))) {
	                this.setState(JSON.parse(ocvSliderValue));
	            }
	        }
	    }).done();

        RNShakeEvent.addEventListener('shake', () => {
            this.roll();
        });
	}

   	componentWillUnmount() {
   		RNShakeEvent.removeEventListener('shake');
   	}

    _roll() {
        this.props.navigation.navigate('Result', dieRoller.rollToHit(this.state.ocv, this.state.isAutofire, this.state.targetDcv));
    }

	_updateCv(key, value) {
		let newState = {...this.state};
		newState[key] = parseInt(value, 10);

		AsyncStorage.setItem('ocvSliderValue', JSON.stringify(newState));

        this.setState(newState);
	}

	_toggleAutofire() {
		let newState = {...this.state};
		newState.isAutofire = !this.state.isAutofire;

		AsyncStorage.setItem('ocvSliderValue', JSON.stringify(newState));

        this.setState(newState);
	}

    _renderDcvSlider() {
        if (this.state.isAutofire) {
            return (
                <Slider
                    label='Target DCV/DMCV:'
                    value={this.state.targetDcv}
                    step={1}
                    min={-30}
                    max={30}
                    onValueChange={this.updateCv}
                    valueKey='targetDcv' />
            );
        }

        return null;
    }

	render() {
		return (
			<Container style={styles.container}>
			    <Header navigation={this.props.navigation} />
				<Content style={styles.content}>
				    <Text style={styles.heading}>Roll To Hit</Text>
					<Slider 
						label='Total OCV/OMCV:'
						value={this.state.ocv}
						step={1} 
						min={-30} 
						max={30}
						onValueChange={this.updateCv}
					    valueKey='ocv'
					/>
                    <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
	              	    <Text style={styles.grey}>Is this an autofire attack?</Text>
		              	<View style={{paddingRight: 10}}>
		              		<Switch value={this.state.isAutofire} onValueChange={() => this.toggleAutofire()} color='#3da0ff'/>
		              	</View>
		            </View>
		            {this._renderDcvSlider()}
					<Button block style={styles.button} onPress={this.roll}>
						<Text uppercase={false}>Roll</Text>
					</Button>
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