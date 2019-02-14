import React, { Component }  from 'react';
import { StyleSheet, View, Image, Switch, AsyncStorage } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShake from 'react-native-shake';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';

export default class SkillScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
		    skillCheck: false,
			value: 8
		};

        this.toggleCheck = this._toggleCheck.bind(this);
		this.updateSliderValue = this._updateSliderValue.bind(this);
		this.roll = this._roll.bind(this);
	}

	componentDidMount() {
	    AsyncStorage.getItem('skillState').then((value) => {
	        if (value !== null) {
	            if (common.compare(this.state, JSON.parse(value))) {
	                this.setState(JSON.parse(value));
	            }
	        }
	    }).done();

        RNShake.addEventListener('ShakeEvent', () => {
            this.roll();
        });
	}

   	componentWillUnmount() {
   		RNShake.removeEventListener('ShakeEvent');
   	}

    _roll() {
        let threshold = this.state.skillCheck ? this.state.value + '-' : null;

        this.props.navigation.navigate('Result', dieRoller.rollCheck(threshold));
    }

	_updateSliderValue(value) {
		let newState = {...this.state};
		newState.value = parseInt(value, 10);

		AsyncStorage.setItem('skillState', JSON.stringify(newState));

        this.setState(newState);
	}

	_toggleCheck() {
		let newState = {...this.state};
		newState.skillCheck = !this.state.skillCheck;

		AsyncStorage.setItem('skillState', JSON.stringify(newState));

        this.setState(newState);
	}

    _renderSlider() {
        if (this.state.skillCheck) {
            return (
                <Slider
                    label='Skill Level:'
                    value={this.state.value}
                    step={1}
                    min={-30}
                    max={30}
                    onValueChange={this.updateSliderValue} />
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
		              	<View style={{paddingRight: 10}}>
		              		<Switch value={this.state.skillCheck} onValueChange={() => this.toggleCheck()} color='#3da0ff'/>
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