import React, { Component }  from 'react';
import { Platform, StyleSheet, View, Image, ScrollView, AsyncStorage, Alert, TouchableHighlight } from 'react-native';
import { Container, Content, Button, Text, Toast, List, ListItem, Left, Right, Body, Tabs, Tab, ScrollableTab, Card, CardItem, Spinner } from 'native-base';
import { randomCharacter } from '../../lib/RandomCharacter';
import Header from '../Header/Header';
import { character } from '../../lib/Character';
import { dieRoller } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class ViewCharacterScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			character: null
		};

		this.rollCheck = this._rollCheck.bind(this);
		this.onSkillCheckLongPress = this._onSkillCheckLongPress.bind(this);
	}
	
	async componentWillMount() {
		let character = await AsyncStorage.getItem('character');

        if (character === null) {
            this.props.navigation.navigate('Home');

            Toast.show({
                text: 'Please load a character first',
                position: 'bottom',
                buttonText: 'OK'
            });

            return;
        }

		this.setState({character: JSON.parse(character).character});
	}

    _rollCheck(threshold) {
        if (threshold !== '') {
            this.props.navigation.navigate('Result', dieRoller.rollCheck(threshold))
        }
    }

	_renderCharacteristics() {
	    let ignoredCharacteristics = ['comeliness'];

	    if (character.isFifthEdition(this.state.character.characteristics.characteristic)) {
	        ignoredCharacteristics = ['ocv', 'dcv', 'omcv', 'dmcv'];
	    }

	    return (
            <View>
                {this.state.character.characteristics.characteristic.map((characteristic, index) => {
                    if (ignoredCharacteristics.indexOf(characteristic.name) !== -1) {
                        return null;
                    }

                    return (
                        <TouchableHighlight key={'characteristic-' + index} underlayColor='#3da0ff' onLongPress={() => this.rollCheck(characteristic.roll)}>
                            <Card>
                                <CardItem style={{backgroundColor: '#355882'}}>
                                    <View style={{flex: 1, flexDirection: 'column'}}>
                                        <View style={{flex: 1, flexDirection: 'row'}}>
                                            <Left>
                                                <Text style={styles.boldGrey}>{characteristic.name.toUpperCase()}</Text>
                                            </Left>
                                            <Body>
                                                <Text style={styles.grey}>{characteristic.total}</Text>
                                            </Body>
                                            <Right>
                                                <Text style={styles.grey}>{characteristic.roll}</Text>
                                            </Right>
                                        </View>
                                        <View style={{flex: 1, flexDirection: 'row'}}>
                                            <Left>
                                                <Text style={styles.grey}>{characteristic.notes}</Text>
                                            </Left>
                                            <Right>
                                                <Text style={styles.grey}>Cost: {characteristic.cost}</Text>
                                            </Right>
                                        </View>
                                    </View>
                                </CardItem>
                            </Card>
                        </TouchableHighlight>
                    );
                })}
                {this._renderMovement()}
            </View>
	    );
	}

    _renderUnusualMovement(label, distance) {
        if (distance === '') {
            return null;
        }

        return (
            <ListItem>
                <Left>
                    <Text style={styles.grey}>{label}</Text>
                </Left>
                <Body>
                    <Text style={styles.grey}>{distance}</Text>
                </Body>
            </ListItem>
        );
    }

    _renderMovement() {
        return (
            <List>
                <ListItem itemDivider style={{backgroundColor: '#375476'}}>
                    <Body><Text style={styles.boldGrey}>Movement</Text></Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Running</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.state.character.movement.running}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Swimming</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.state.character.movement.swimming}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Leaping (H)</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.state.character.movement.leaping.horizontal}</Text>
                    </Body>
                </ListItem>
                <ListItem>
                    <Left>
                        <Text style={styles.grey}>Leaping (V)</Text>
                    </Left>
                    <Body>
                        <Text style={styles.grey}>{this.state.character.movement.leaping.vertical}</Text>
                    </Body>
                </ListItem>
                {this._renderUnusualMovement('Flight', this.state.character.movement.flight)}
                {this._renderUnusualMovement('Gliding', this.state.character.movement.gliding)}
                {this._renderUnusualMovement('Swinging', this.state.character.movement.swinging)}
                {this._renderUnusualMovement('Teleportation', this.state.character.movement.teleportation)}
                {this._renderUnusualMovement('Tunneling', this.state.character.movement.tunneling)}
            </List>
        );
    }

    _onSkillCheckLongPress(type, item) {
        let matches = item.match(/(\s[0-9]+\-|\([0-9]+\-\))$/);

        if (matches !== null) {
            let match = matches[0].trim();

            if (match.indexOf('(') !== -1) {
                match = match.slice(1, -1);
            }

            this.rollCheck(match);
        }
    }

    _renderText(text, columnHeading) {
        let items = text.split('|').slice(0, -1);

        if (items.length === 0) {
            return null;
        }

        return (
            <Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading={columnHeading + 's'}>
                <ScrollView style={localStyles.tabContent}>
                <List>
                    <ListItem itemDivider style={{backgroundColor: '#375476'}}>
                        <Left>
                            <Text style={styles.boldGrey}>{columnHeading}</Text>
                        </Left>
                        <Right>
                            <Text style={styles.boldGrey}>Cost</Text>
                        </Right>
                    </ListItem>
                    {items.map((item, index) => {
                        let lineItem = this._spliceItem(item);
                        let costEndPosition = lineItem[1].indexOf(')');

                        return (
                            <ListItem key={'item-' + index} underlayColor='#3da0ff' onLongPress={() => this.onSkillCheckLongPress(columnHeading, lineItem[1].substring(costEndPosition + 1))}>
                                <Left>
                                    <Text style={styles.grey}>{lineItem[0] + ' ' + lineItem[1].substring(costEndPosition + 1)}</Text>
                                </Left>
                                <Right>
                                    <Text style={styles.grey}>{lineItem[1].substring(1, costEndPosition)}</Text>
                                </Right>
                            </ListItem>
                        )
                    })}
                </List>
                </ScrollView>
            </Tab>
        );
    }

    _spliceItem(text) {
        let start = text.indexOf('(');
        let end = text.indexOf(')');

        if (start < end) {
            return ['', text];
        }

        return [
            '    ' + text.slice(0, end + 1),
            text.substring(end + 3)
        ];
    }

	render() {
	    if (this.state.character === null || this.state.character.characteristics === null || this.state.character.appearance === null) {
	        return (
                <Container style={localStyles.container}>
                    <Header hasTabs={false} navigation={this.props.navigation} />
                    <Content style={{backgroundColor: '#375476', paddingTop: 10}}>
                        <Spinner color='#D0D1D3' />
                    </Content>
	            </Container>
	        );
	    }

		return (
		  <Container style={localStyles.container}>
		  	<Header hasTabs={false} navigation={this.props.navigation} />
		  	<Content style={{backgroundColor: '#375476', paddingTop: Platform.OS === 'ios' ? 0 : 10}}>
                <Tabs tabBarUnderlineStyle={localStyles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="General">
			  			<ScrollView style={localStyles.tabContent}>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Name:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.name}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Aliases:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.aliases}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Player:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.playerName}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Height:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.appearance.height}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Weight:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.appearance.weight}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Eye Color:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.appearance.eyeColor}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Hair Color:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.appearance.hairColor}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
			        			<Text style={styles.grey}>
			        			    <Text style={styles.boldGrey}>Description: </Text>{this.state.character.description}
			        			</Text>
				        	</ListItem>
                            <ListItem>
                                <Text style={styles.grey}>
			        			    <Text style={styles.boldGrey}>Background: </Text>{this.state.character.background}
			        			</Text>
				        	</ListItem>
                            <ListItem>
			        			<Text style={styles.grey}>
			        			    <Text style={styles.boldGrey}>Personality: </Text>{this.state.character.personality}
			        			</Text>
				        	</ListItem>
                            <ListItem>
			        			<Text style={styles.grey}>
			        			    <Text style={styles.boldGrey}>Quote: </Text>{this.state.character.quote}
			        	        </Text>
				        	</ListItem>
                            <ListItem>
			        			<Text style={styles.grey}>
			        			    <Text style={styles.boldGrey}>Tactics: </Text>{this.state.character.tactics}
			        			</Text>
				        	</ListItem>
                            <ListItem>
			        			<Text style={styles.grey}>
			        			    <Text style={styles.boldGrey}>Campaign Use: </Text>{this.state.character.campaignUse}
			        			</Text>
				        	</ListItem>
				        	<View style={{paddingBottom: 20}} />
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Total Experience:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.experience.total}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Earned Experience:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.experience.earned}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Spent Experience:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.experience.spent}</Text>
				        		</Body>
				        	</ListItem>
                            <ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Unspent Experience:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.experience.unspent}</Text>
				        		</Body>
				        	</ListItem>
			  			</ScrollView>
			  		</Tab>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Characteristics">
			  		    <ScrollView style={localStyles.tabContent}>
			  		        {this._renderCharacteristics()}
			  		    </ScrollView>
			  		</Tab>
			  		{this._renderText(this.state.character.powers.text, 'Power')}
                    {this._renderText(this.state.character.martialArts.text, 'Maneuver')}
			  		{this._renderText(this.state.character.skills.text, 'Skill')}
			  		{this._renderText(this.state.character.perks.text, 'Perk')}
			  		{this._renderText(this.state.character.talents.text, 'Talent')}
			  		{this._renderText(this.state.character.disadvantages.text, 'Disadvantage')}
			  	</Tabs>
		  	</Content>
	      </Container>	
		);
	}
}

const localStyles = StyleSheet.create({
	tabInactive: {
		backgroundColor: '#3a557f'
	},
	tabActive: {
		backgroundColor: '#476ead'
	},
	tabBarUnderline: {
		backgroundColor: '#3da0ff'
	},
	tabContent: {
		backgroundColor: '#375476'
	},
	pointCostsHeader: {
		alignSelf: 'center',
		textDecorationLine: 'underline'
	}
});
