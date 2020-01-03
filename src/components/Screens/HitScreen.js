import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { Platform, StyleSheet, View, Switch, Alert, TouchableHighlight } from 'react-native';
import { Container, Content, Button, Text, Tabs, Tab, ScrollableTab, Icon } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import RNShake from 'react-native-shake';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import hitLocations from '../../../public/hitLocations.json';
import { updateFormValue } from '../../reducers/forms';

class HitScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
			tabsLocked: false
		};

		this.updateFormValue = this._updateFormValue.bind(this);
		this.toggleTabsLocked = this._toggleTabsLocked.bind(this);
		this.roll = this._roll.bind(this);
		this.setLocation = this._setLocation.bind(this);
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
        this.props.navigation.navigate('Result', dieRoller.rollToHit(this.props.hitForm.ocv, this.props.hitForm.numberOfRolls, this.props.hitForm.isAutofire, this.props.hitForm.targetDcv));
    }

	_updateFormValue(key, value) {
	    if (key === 'numberOfRolls') {
	        value = parseInt(value, 10);
	    }

		this.props.updateFormValue('hit', key, value);
	}

    _setLocation(location) {
        if (this.props.hitForm.selectedLocation === location) {
            location = -1;
        }

        this.setState({selectedLocation: location});
    }

    _toggleTabsLocked(locked) {
        let newState = {...this.state};
        newState.tabsLocked = locked;

        this.setState(newState);
    }

    _renderDcvSlider() {
        if (this.props.hitForm.isAutofire) {
            return (
                <Slider
                    label='Target DCV/DMCV:'
                    value={this.props.hitForm.targetDcv}
                    step={1}
                    min={-30}
                    max={30}
                    onValueChange={this.updateFormValue}
                    valueKey='targetDcv'
                    toggleTabsLocked={this.toggleTabsLocked} />
            );
        }

        return null;
    }

    _renderLocationDetails() {
        if (this.props.hitForm.selectedLocation === -1) {
            return null;
        }

        return (
            <View>
                <Text style={[styles.grey, styles.subHeading]}>Damage Multipliers</Text>
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: 10}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>STUNx</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>NSTUN</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>BODYx</Text></View>
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', paddingBottom: 10}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>x{hitLocations[this.props.hitForm.selectedLocation].stunX}</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>x{hitLocations[this.props.hitForm.selectedLocation].nStun}</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>x{hitLocations[this.props.hitForm.selectedLocation].bodyX}</Text></View>
                    </View>
                </View>
            </View>
        );
    }

	render() {
		return (
			<Container style={styles.container}>
			    <Header navigation={this.props.navigation} />
				<Content scrollEnable={false}>
                    <Tabs locked={this.state.tabsLocked} tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Roll To Hit">
                            <View style={[styles.tabContent, {paddingHorizontal: 10}]}>
                                <Slider
                                    label='Total OCV/OMCV:'
                                    value={this.props.hitForm.ocv}
                                    step={1}
                                    min={-30}
                                    max={30}
                                    onValueChange={this.updateFormValue}
                                    valueKey='ocv'
                                    toggleTabsLocked={this.toggleTabsLocked}
                                />
                                <Slider
                                    label='Rolls:'
                                    value={this.props.hitForm.numberOfRolls}
                                    step={1}
                                    min={1}
                                    max={20}
                                    onValueChange={this.updateFormValue}
                                    valueKey='numberOfRolls'
                                    toggleTabsLocked={this.toggleTabsLocked}
                                />
                                <View style={[localStyles.titleContainer, localStyles.checkContainer]}>
                                    <Text style={styles.grey}>Is this an autofire attack?</Text>
                                    <View style={{paddingRight: 10}}>
                                        <Switch
											value={this.props.hitForm.isAutofire}
											onValueChange={() => this.updateFormValue('isAutofire', !this.props.hitForm.isAutofire)}
											color='#3da0ff'
											minimumTrackTintColor='#14354d'
											maximumTrackTintColor='#14354d'
											thumbTintColor='#14354d'
											onTintColor="#01121E"
										/>
                                    </View>
                                </View>
                                {this._renderDcvSlider()}
                                <Button block style={styles.button}  onPress={this.roll}>
                                    <Text uppercase={false}>Roll</Text>
                                </Button>
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Range Mods">
                            <View style={[styles.tabContent, {paddingHorizontal: 10}]}>
                                <View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Range (M)</Text></View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>RMOD</Text></View>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>0-8</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>0</Text>
                                    </View>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>9-16</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>-2</Text>
                                    </View>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>17-32</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>-4</Text>
                                    </View>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>33-64</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>-6</Text>
                                    </View>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>65-128</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>-8</Text>
                                    </View>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>129-250</Text>
                                    </View>
                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                        <Text style={styles.grey}>-10</Text>
                                    </View>
                                </View>
                            </View>
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Hit Locations">
                            <View style={[styles.tabContent, {paddingHorizontal: 10}]}>
                                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Location</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Roll</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Hit</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Damage</Text></View>
                                    </View>
                                    {hitLocations.map((hitLocation, index) => {
                                        let stars = [];

                                        for (let i = 0; i < hitLocation.stunX; i++) {
                                            stars.push(<Icon key={'star-' + index + '-' + i} name='md-star' style={[styles.grey, {fontSize: 14}]} />);
                                        }

                                        return (
                                            <TouchableHighlight key={'hit-location-' + index} style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}} underlayColor='#3da0ff' onPress={() => this.setLocation(index)}>
                                                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                        <Text style={styles.grey}>{hitLocation.location}</Text>
                                                    </View>
                                                    <View style={{flex: 1, alignSelf: 'center'}}>
                                                        <Text style={styles.grey}>{hitLocation.roll}</Text>
                                                    </View>
                                                    <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                        <Text style={styles.grey}>{hitLocation.penalty}</Text>
                                                    </View>
                                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
                                                        {stars.map((star, index) => {
                                                            return star;
                                                        })}
                                                    </View>
                                                </View>
                                            </TouchableHighlight>
                                        );
                                    })}
                                </View>
                                {this._renderLocationDetails()}
                            </View>
                        </Tab>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Targeted Shots">
                            <View style={[styles.tabContent, {paddingHorizontal: 10}]}>
                                <View>
                                    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5}}>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Targeted Shot</Text></View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Hit</Text></View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Location</Text></View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>Head Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-4</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>1d6+3</Text>
                                            </View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>High Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-2</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>2d6+1</Text>
                                            </View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>Low Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-2</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>2d6+7 (19=foot)</Text>
                                            </View>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: 5}}>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>Leg Shot</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>-4</Text>
                                            </View>
                                            <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                <Text style={styles.grey}>1d6+12</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
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
	}
});

const mapStateToProps = state => {
    return {
        hitForm: state.forms.hit
    };
}

const mapDispatchToProps = {
    updateFormValue
}

export default connect(mapStateToProps, mapDispatchToProps)(HitScreen);
