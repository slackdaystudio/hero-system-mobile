import React, { Component }  from 'react';
import { Platform, StyleSheet, View, Image, Switch, AsyncStorage, ScrollView } from 'react-native';
import { Container, Content, Button, Text, Picker, Item, Tabs, Tab, ScrollableTab } from 'native-base';
import RNShakeEvent from 'react-native-shake-event';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller, KILLING_DAMAGE, NORMAL_DAMAGE, PARTIAL_DIE_PLUS_ONE, PARTIAL_DIE_HALF } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import moves from '../../../public/moves.json';

export default class DamageScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
			dice: 12,
			partialDie: 0,
			killingToggled: false,
			damageType: NORMAL_DAMAGE,
			stunMultiplier: 0,
			useHitLocations: false,
			isMartialManeuver: false,
			isTargetFlying: false,
			isExplosion: false,
			useFifthEdition: false
		};
		
		this.updateState = this._updateState.bind(this);
		this.toggleDamageType = this._toggleDamageType.bind(this);
		this.roll = this._roll.bind(this);
	}
	
	componentDidMount() {
	    AsyncStorage.getItem('damageState').then((value) => {
	    	if (value !== undefined) {
	    	    if (common.compare(this.state, JSON.parse(value))) {
	    	        this.setState(JSON.parse(value), () => {
                        AsyncStorage.getItem('appSettings').then((value) => {
                            if (value !== undefined) {
                                let newState = {...this.state};
                                newState.useFifthEdition = JSON.parse(value).useFifthEdition;

                                this.setState(newState);
                            }
                        }).done();
	    	        });
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
        this.props.navigation.navigate('Result', dieRoller.rollDamage(this.state));
    }

	_updateState(key, value) {
		let newState = {...this.state};
		newState[key] = key === 'dice' || key === 'stunMultiplier' ? parseInt(value, 10) : value;

		AsyncStorage.setItem('damageState', JSON.stringify(newState));
		
        this.setState(newState);
	}
	
	_toggleDamageType() {
		let newState = {...this.state};
		
		if (!this.state.killingToggled) {
			newState.killingToggled = true;
			newState.damageType = KILLING_DAMAGE;
		} else {
			newState.killingToggled = false;
			newState.damageType = NORMAL_DAMAGE;
		}
		
		AsyncStorage.setItem('damageState', JSON.stringify(newState));
		
        this.setState(newState);
	}
	
	_toggleHitLocations() {
		this.updateState('useHitLocations', !this.state.useHitLocations);
	}

	_toggleMartialManeuver() {
		this.updateState('isMartialManeuver', !this.state.isMartialManeuver);
	}

	_toggleTargetFlying() {
		this.updateState('isTargetFlying', !this.state.isTargetFlying);
	}

    _toggleExplosion() {
        this.updateState('isExplosion', !this.state.isExplosion);
    }

	_renderStunMultiplier() {
		if (this.state.killingToggled) {
			return (
				<Slider 
					label='+/- Stun Multiplier:'
					value={this.state.stunMultiplier} 
					step={1} 
					min={-10} 
					max={10}
					onValueChange={this.updateState}
					valueKey='stunMultiplier' />
			);
		}
		
		return null;
	}
	
	render() {
		return (
			<Container style={styles.container}>
				<Header navigation={this.props.navigation} />
				<Content style={{backgroundColor: '#375476', paddingTop: Platform.OS === 'ios' ? 0 : 20}}>
                    <Tabs tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Roll For Damage">
                            <ScrollView style={[styles.tabContent, {paddingHorizontal: 10}]}>
                                <Slider
                                    label='Dice:'
                                    value={this.state.dice}
                                    step={1}
                                    min={0}
                                    max={50}
                                    onValueChange={this.updateState}
                                    valueKey='dice'
                                />
                                <Picker
                                  inlinelabel
                                  label='Test'
                                  style={localStyles.grey}
                                  textStyle={styles.grey}
                                  iosHeader="Select one"
                                  mode="dropdown"
                                  selectedValue={this.state.partialDie}
                                  onValueChange={(value) => this.updateState('partialDie', value)}
                                >
                                  <Item label="No partial die" value="0" />
                                  <Item label="+1 pip" value={PARTIAL_DIE_PLUS_ONE} />
                                  <Item label="+½ die" value={PARTIAL_DIE_HALF} />
                                </Picker>
                                <View style={{paddingBottom: 30}} />
                                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                    <Text style={styles.grey}>Is this a killing attack?</Text>
                                    <View style={{paddingRight: 10}}>
                                        <Switch value={this.state.killingToggled} onValueChange={() => this.toggleDamageType()} color='#3da0ff'/>
                                    </View>
                                </View>
                                {this._renderStunMultiplier()}
                                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                    <Text style={styles.grey}>Is this an explosion?</Text>
                                    <View style={{paddingRight: 10}}>
                                        <Switch value={this.state.isExplosion} onValueChange={() => this._toggleExplosion()} color='#3da0ff'/>
                                    </View>
                                </View>
                                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                    <Text style={styles.grey}>Use hit locations?</Text>
                                    <View style={{paddingRight: 10}}>
                                        <Switch value={this.state.useHitLocations} onValueChange={() => this._toggleHitLocations()} color='#3da0ff'/>
                                    </View>
                                </View>
                                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                    <Text style={styles.grey}>Attack is a martial maneuver?</Text>
                                    <View style={{paddingRight: 10}}>
                                        <Switch value={this.state.isMartialManeuver} onValueChange={() => this._toggleMartialManeuver()} color='#3da0ff'/>
                                    </View>
                                </View>
                                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                    <Text style={styles.grey}>Is the target flying?</Text>
                                    <View style={{paddingRight: 10}}>
                                        <Switch value={this.state.isTargetFlying} onValueChange={() => this._toggleTargetFlying()} color='#3da0ff'/>
                                    </View>
                                </View>
                                <View style={{paddingBottom: 30}} />
                                <Button block style={styles.button} onPress={this.roll}>
                                    <Text uppercase={false}>Roll</Text>
                                </Button>
                                <View style={{paddingBottom: 30}} />
                            </ScrollView>
                        </Tab>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Combat Moves">
                            <ScrollView style={[styles.tabContent, {paddingBottom: 20, paddingHorizontal: 10}]}>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Move</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Phase</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>OCV</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>DCV</Text></View>
                                </View>
                                {moves.map((move, index) => {
                                    return (
                                        <View key={'move-' + index}>
                                            <View key={'move-' + index} style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: 5}}>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.name}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.phase}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.ocv}</Text></View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{move.dcv}</Text></View>
                                            </View>
                                            <View key={'move-' + index} style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignSelf: 'flex-start', paddingBottom: 5}}>
                                                <View style={{flex: 1, alignSelf: 'stretch', borderBottomWidth: 1, borderColor: '#D0D1D3'}}><Text style={styles.grey}></Text></View>
                                                <View style={{flex: 3, justifyContent: 'flex-start', borderBottomWidth: 1, borderColor: '#D0D1D3'}}>
                                                    <Text style={[styles.grey, {fontStyle: 'italic'}]}>{move.effect}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </Tab>
                    </Tabs>
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
	},
	picker: {
		color: '#fff'
	},
	list: {
		paddingBottom: 10
	},
	grey: {
	    ...Platform.select({
	        android: {
	            color: '#D0D1D3'
	        }
	    })
	}
});
