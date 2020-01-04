import React, { Component }  from 'react';
import { BackHandler, StyleSheet, View, Image, Alert } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShake from 'react-native-shake';
import AnimateNumber from 'react-native-animate-number';
import { NavigationEvents } from 'react-navigation';
import Header from '../Header/Header';
import { dieRoller, SKILL_CHECK, TO_HIT, NORMAL_DAMAGE, KILLING_DAMAGE } from '../../lib/DieRoller';
import { statistics } from '../../lib/Statistics';
import styles from '../../Styles';

export default class ResultScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
			result: props.navigation.state.params.result
		}

		this.reRoll = this._reRoll.bind(this);
	}

	onDidFocus() {
		this.setState({result: this.props.navigation.state.params.result}, () => {
		    this._updateStatistics();
		});

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this.props.navigation.state.params.from || 'Home');

            return true;
        });

        RNShake.addEventListener('ShakeEvent', () => {
            this.reRoll();
        });
	}

   	onDidBlur() {
   	    this.backHandler.remove();

   		RNShake.removeEventListener('ShakeEvent');

   		this.props.navigation.state.params = null;
   	}

    async _updateStatistics() {
        if (this.state.result.hasOwnProperty('results')) {
            for (let i = 0; i < this.state.result.results.length; i++) {
                await statistics.add(this.state.result.results[i]);
            }
        } else {
            await statistics.add(this.state.result);
        }
    }

	_reRoll() {
		this.setState({
			result: dieRoller.rollAgain(this.props.navigation.state.params.result)
		}, () => {
            this._updateStatistics();
		});
	}
	
	_renderToHitInfo(result) {
		if (result.total === 3) {
			return <Text style={styles.grey}>You have critically hit your target</Text>;
		} else if (result.total === 18) {
			return <Text style={styles.grey}>You have missed your target</Text>;
		}

		if (result.isAutofire) {
		    if (result.hits > 0) {
		        return <Text style={styles.grey}>You can hit your target up to {result.hits}x</Text>
		    } else {
		        return <Text style={styles.grey}>You have missed your target with all of your shots</Text>
		    }
		}

		return <Text style={styles.grey}>You can hit a DCV/DMCV of {result.hitCv} or less</Text>
	}
	
	_renderHitLocation() {
		let hitLocation = this.state.result.hitLocationDetails;
		
		if (this.state.result.rollType === NORMAL_DAMAGE) {
			return (
				<Text style={styles.grey}>
					{hitLocation.location} (NSTUN: x{hitLocation.nStun})
				</Text>
			);
		} else if (this.state.result.rollType === KILLING_DAMAGE) {
			return (
				<Text style={styles.grey}>
					{hitLocation.location} (STUNx: x{hitLocation.stunX}, BODYx: x{hitLocation.bodyX})
				</Text>
			);
		}
		
		return <Text />;
	}
	
	_renderDamageInfo(result) {
	    if (result.damageForm.isExplosion) {
	        return (
	            <View style={{paddingBottom: 20}}>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Distance</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>STUN</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>BODY</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>KB</Text></View>
                    </View>
	                {result.explosion.map((entry, index) => {
	                    return (
                            <View key={'exp-' + index} style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: 5}}>
                                <View style={{flex: 1, alignSelf: 'flex-end'}}><Text style={styles.grey}>{this._renderDistance(entry.distance, result)}</Text></View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this._renderStun(entry.stun)}</Text></View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{entry.body}</Text></View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this._renderKnockback(entry.knockback, result)}</Text></View>
                            </View>
	                    );
	                })}
	            </View>
	        );
	    }

		return (
			<View style={{paddingBottom: 20}}>
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Hit Location: </Text>
					{this._renderHitLocation()}
				</View>
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Stun: </Text>
					{this._renderStun(result.stun)}
				</View>	
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Body: </Text>
					<Text style={styles.grey}>{result.body}</Text>
				</View>
				<View style={localStyles.lineContainer}>
					<Text style={[styles.boldGrey, localStyles.alignStart]}>Knockback: </Text>
					{this._renderKnockback(result.knockback, result)}
				</View>
			</View>
		);
	}

	_renderSkillCheckInfo(result) {
	    let overUnder = result.threshold - result.total;

	    if (overUnder >= 0) {
	        if (overUnder === 0) {
                return (
                    <Text style={styles.grey}>You made your check with no points to spare</Text>
                );
	        }

            return (
                <Text style={styles.grey}>You made your check by {overUnder} points</Text>
            );
	    }

        return (
            <Text style={styles.grey}>You <Text style={{color: 'red'}}>failed</Text> your check by {overUnder * -1} points</Text>
        );
	}

	_renderAdditionalRollInfo(result) {
		if (result.rollType === TO_HIT) {
			return this._renderToHitInfo(result);
		} else if (result.rollType === NORMAL_DAMAGE || result.rollType === KILLING_DAMAGE) {
			return this._renderDamageInfo(result);
		} else if (result.rollType === SKILL_CHECK && result.threshold !== -1) {
		    return this._renderSkillCheckInfo(result);
		}
		
		return null;
	}

	_renderDistance(distance, result) {
		let distanceText = '';

		if (result.damageForm.useFifthEdition) {
		    distanceText = distance / 2 + '"';
		} else {
		    distanceText = distance + 'm';
		}

		return <Text style={styles.grey}>{distanceText}</Text>;
	}

	_renderStun(stun) {
		stun = stun < 0 ? 0 : stun;
		
		return <Text style={styles.grey}>{stun}</Text>;
	}
	
	_renderKnockback(knockback, result) {
		knockback = knockback < 0 ? 0 : knockback;
		let knockbackText = '';

		if (result.damageForm.useFifthEdition) {
		    knockbackText = knockback / 2 + '"';
		} else {
		    knockbackText = knockback + 'm';
		}

		return <Text style={styles.grey}>{knockbackText}</Text>;
	}

	_renderRoll() {
	    if (this.state.result.hasOwnProperty('results')) {
	        return this.state.result.results.map((result, index) => {
                return (
                    <View key={'roll-result-' + index}>
                        <Text style={[styles.grey, localStyles.rollResult]}><AnimateNumber value={result.total} formatter={(val) => {return val.toFixed(0)}} interval={1} /></Text>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Dice Rolled: </Text>{result.rolls.length} ({result.rolls.join(', ')})
                        </Text>
                        {this._renderAdditionalRollInfo(result)}
                    </View>
                );
	        });
	    }

	    return (
            <View>
                <Text style={[styles.grey, localStyles.rollResult]}><AnimateNumber value={this.state.result.total} formatter={(val) => {return val.toFixed(0)}} /></Text>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Dice Rolled: </Text>{this.state.result.rolls.length} ({this.state.result.rolls.join(', ')})
                </Text>
                {this._renderAdditionalRollInfo(this.state.result)}
            </View>
	    );
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
				    <Text style={styles.heading}>Roll Result</Text>
					<View>
						{this._renderRoll()}
						<View style={styles.buttonContainer}>
			    			<Button block style={styles.button}  onPress={this.reRoll}>
			    				<Text uppercase={false}>Roll Again</Text>
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
		fontSize: 100,
		fontWeight: 'bold'
	},
	lineContainer: {
	    flexDirection: 'row',
	    alignItems: 'center'
	},
	alignStart: {
		alignSelf: 'flex-start'
	}
});