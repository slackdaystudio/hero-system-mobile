import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import Header from '../Header/Header';
import { dieRoller, TO_HIT, NORMAL_DAMAGE, KILLING_DAMAGE } from '../../lib/DieRoller';
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
	
	_renderToHitInfo() {
		if (this.state.result.total === 3) {
			return <Text style={styles.grey}>You have critically hit your target</Text>;
		} else if (this.state.result.total === 18) {
			return <Text style={styles.grey}>You have missed your target</Text>;
		}
		
		return <Text style={styles.grey}>You can hit a DCV/DMCV of {this.state.result.hitCv} or less</Text>
	}
	
	_renderHitLocation() {
		let hitLocation = this.state.result.hitLocationDetails;
		
		if (this.state.result.rollType === NORMAL_DAMAGE) {
			return (
				<Text style={styles.grey}>
					{hitLocation.location} (NSTUN: {hitLocation.nStun})
				</Text>
			);
		} else if (this.state.result.rollType === KILLING_DAMAGE) {
			return (
				<Text style={styles.grey}>
					{hitLocation.location} (STUNx: {hitLocation.stunX}, BODYx: {hitLocation.bodyX})
				</Text>
			);
		}
		
		return <Text />;
	}
	
	_renderDamageInfo() {
		return (
			<View style={{paddingBottom: 20}}>
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Hit Location: </Text>
					{this._renderHitLocation()}
				</View>
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Stun: </Text>
					{this._renderStun()}
				</View>	
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Body: </Text>
					<Text style={styles.grey}>{this.state.result.body}</Text>
				</View>
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Knockback: </Text>
					{this._renderKnockback()}
				</View>
			</View>
		);
	}
	
	_renderAdditionalRollInfo() {
		if (this.state.result.rollType === TO_HIT) {
			return this._renderToHitInfo();
		} else if (this.state.result.rollType === NORMAL_DAMAGE || this.state.result.rollType === KILLING_DAMAGE) {
			return this._renderDamageInfo();
		}
		
		return null;
	}
	
	_renderStun() {
		let stun = this.state.result.stun < 0 ? 0 : this.state.result.stun;
		
		return <Text style={styles.grey}>{stun}</Text>;
	}
	
	_renderKnockback() {
		let knockback = this.state.result.knockback < 0 ? 0 : this.state.result.knockback;
		
		return <Text style={styles.grey}>{knockback}m</Text>;
	}
	
	render() {	
		return (
			<Container style={styles.container}>
				<Header />
				<Content style={styles.content}>
					<View>
						<Text style={[styles.grey, localStyles.rollResult]}>{this.state.result.total}</Text>
						<View style={localStyles.lineContainer}>
							<Text style={[styles.boldGrey, localStyles.alignStart]}>Dice Rolled: </Text>
							<Text style={styles.grey}>{this.state.result.rolls.length} ({this.state.result.rolls.join(', ')})</Text>
						</View>
						{this._renderAdditionalRollInfo()}
						<View style={styles.buttonContainer}>
			    			<Button block style={styles.button} onPress={this.reRoll}>
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
	rollResult: {
		fontSize: 75
	},
	lineContainer: {
	    flexDirection: 'row',
	    alignItems: 'center'
	},
	alignStart: {
		alignSelf: 'flex-start'
	}
});