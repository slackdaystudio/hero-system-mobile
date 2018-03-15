import React, { Component }  from 'react';
import { StyleSheet, View, Switch, AsyncStorage, Alert, ScrollView } from 'react-native';
import { Container, Content, Button, Text, Tabs, Tab, ScrollableTab, Icon } from 'native-base';
import RNShakeEvent from 'react-native-shake-event';
import Slider from '../Slider/Slider';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import hitLocations from '../../../public/hitLocations.json';

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
                    <Tabs tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Roll To Hit">
                            <ScrollView style={styles.tabContent}>
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
                            </ScrollView>
                        </Tab>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Hit Locations">
                            <ScrollView style={styles.tabContent}>
                                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>Location</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>Roll</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>Hit</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>Damage</Text></View>
                                    </View>
                                    {hitLocations.map((hitLocation, index) => {
                                        let stars = [];

                                        for (let i = 0; i < hitLocation.stunX; i++) {
                                            stars.push(<Icon key={'star-' + index + '-' + i} name='md-star' style={[styles.grey, {fontSize: 14}]} />);
                                        }

                                        return (
                                            <View key={'hit-location-' + index} style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                                    <Text style={styles.grey}>{hitLocation.location}</Text>
                                                </View>
                                                <View style={{flex: 1, alignSelf: 'stretch'}}>
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
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </Tab>
                        <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Targeted Shots">
                            <ScrollView style={styles.tabContent}>
                                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>Targeted Shot</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>Hit</Text></View>
                                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.boldGrey}>Location</Text></View>
                                    </View>
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
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
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
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
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
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
                                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch'}}>
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
	}
});