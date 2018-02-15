import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import { dieRoller, TO_HIT } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class ResultScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			result: props.navigation.state.params
		}
		
		this.reRoll = this._reRoll.bind(this);
	}
	
	_reRoll() {
		this.setState({
			result: dieRoller.rollAgain(this.props.navigation.state.params)
		});
	}
	
	_renderAdditionalRollInfo() {
		if (this.state.result.rollType === TO_HIT) {
			if (this.state.result.total === 3) {
				return <Text style={styles.grey}>You have critically hit your target</Text>;
			} else if (this.state.result.total === 18) {
				return <Text style={styles.grey}>You have missed your target</Text>;
			}
			
			return <Text style={styles.grey}>You can hit a DCV/DMCV of {this.state.result.hitCv} or less</Text>
		}
		
		return null;
	}
	
	render() {	
		return (
			<Container style={styles.container}>
				<Content>
					<View style={styles.logo}>
						<Image source={require('../../../public/hero_logo.png')} />
					</View>
					<View>
						<Text style={styles.heading}>{this.state.result.total}</Text>
						<View style={localStyles.diceRolledContainer}>
							<Text style={localStyles.diceRolled}>Dice Rolled: </Text>
							<Text style={styles.grey}>{this.state.result.rolls.length} ({this.state.result.rolls.join(', ')})</Text>
						</View>
						{this._renderAdditionalRollInfo()}
						<View style={styles.buttonContainer}>
			    			<Button block onPress={this.reRoll}>
			    				<Text>Roll Again</Text>
			    			</Button>
			    		</View>
			      	</View>
			    </Content>
		    </Container>
		);
	}
}

const localStyles = StyleSheet.create({
	diceRolledContainer: {
	    flexDirection: 'row',
	    alignItems: 'center'
	},
	diceRolled: {
		fontWeight: 'bold',
		color: '#D0D1D3',
		alignSelf: 'flex-start'
	}
});