import React, { Component }  from 'react';
import { StyleSheet, View, Image, ScrollView } from 'react-native';
import { Container, Content, Button, Text, List, ListItem, Left, Body, Tabs, Tab, ScrollableTab } from 'native-base';
import RNShakeEvent from 'react-native-shake-event';
import { randomCharacter } from '../../lib/RandomCharacter';
import LabelAndContent from '../LabelAndContent/LabelAndContent';
import Header from '../Header/Header';
import styles from '../../Styles';

export default class RandomCharacterScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			character: randomCharacter.generate()
		}
		
		this.reRoll = this._reRoll.bind(this);
	}
	
	componentWillMount() {
		RNShakeEvent.addEventListener('shake', () => {
			this._reRoll();
		});
	}
	
	componentWillUnmount() {
		RNShakeEvent.removeEventListener('shake');
	}
	
	_reRoll() {
		this.setState({
			character: randomCharacter.generate()
		});
	}

	_renderCharacteristics() {
		let elements = [];
		
		for (let prop in this.state.character.archtype.characteristics) {
			elements.push(
				<ListItem key={prop}>
	        		<Left>
	        			<Text style={styles.boldGrey}>{this.state.character.archtype.characteristics[prop]}</Text>
	        		</Left>
	        		<Body>
	        			<Text style={styles.grey}>{prop.toUpperCase()}</Text>
	        		</Body>
	        	</ListItem>
			);
		}
		
		return (
			<View>
				{elements.map((element, index) => {
					return element;
				})}
			</View>
		);
	}
		
	render() {
		return (
		  <Container style={localStyles.container}>
		  	<Header hasTabs={true} navigation={this.props.navigation} />
		  	<Content style={{backgroundColor: '#3d6594'}}>
			  	<Tabs tabBarUnderlineStyle={localStyles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} heading="General">
			  			<ScrollView style={localStyles.tabContent}>
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Archtype:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.archtype.name}</Text>
				        		</Body>
				        	</ListItem>
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Gender:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.gender}</Text>
				        		</Body>
				        	</ListItem>	
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Special FX:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.specialFx}</Text>
				        		</Body>
				        	</ListItem>	
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Profession:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.skills.profession}</Text>
				        		</Body>
				        	</ListItem>	
				        	<View style={{paddingBottom: 20}} />
				        	<Text style={[styles.boldGrey, localStyles.pointCostsHeader]}>Point Costs</Text>
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Characteristics:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.archtype.characteristicsCost}</Text>
				        		</Body>
				        	</ListItem>	
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Powers:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.powers.powersCost}</Text>
				        		</Body>
				        	</ListItem>			        	
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Skills:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.skills.cost}</Text>
				        		</Body>
				        	</ListItem>	
				        	<ListItem>
				        		<Left>
				        			<Text style={styles.boldGrey}>Disadvantages:</Text>
				        		</Left>
				        		<Body>
				        			<Text style={styles.grey}>{this.state.character.disadvantages.disadvantagesCost}</Text>
				        		</Body>
				        	</ListItem>		        	
				        	<View style={{paddingBottom: 20}} />
							<View style={styles.buttonContainer}>
				    			<Button block style={styles.button} onPress={this.reRoll}>
				    				<Text>Roll Again</Text>
				    			</Button>
				    		</View>
			    		</ScrollView>
			  		</Tab>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} heading="Characteristics">
			  			<ScrollView style={localStyles.tabContent}>
			  				{this._renderCharacteristics()}
			  			</ScrollView>
			  		</Tab>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} heading="Powers">
			  			<ScrollView style={localStyles.tabContent}>
					  		{this.state.character.powers.powers.map((power, index) => {
								return (
									<ListItem key={'power-' + index}>
						        		<Left>
						        			<Text style={styles.boldGrey}>{power.cost}</Text>
						        		</Left>
						        		<Body>
						        			<Text style={styles.grey}>{power.power}</Text>
						        		</Body>
						        	</ListItem>							
								);
							})}
				  		</ScrollView>
			  		</Tab>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} heading="Skills">
			  			<ScrollView style={localStyles.tabContent}>
					  		{this.state.character.skills.skills.map((skill, index) => {
								return (
									<ListItem key={'skill-' + index}>
						        		<Body>
						        			<Text style={styles.grey}>{skill}</Text>
						        		</Body>
						        	</ListItem>							
								);
							})}
				  		</ScrollView>
			  		</Tab>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} heading="Disadvantages">
			  			<ScrollView style={localStyles.tabContent}>
					  		{this.state.character.disadvantages.disadvantages.map((disad, index) => {
								return (
									<ListItem key={'disad-' + index}>
						        		<Left>
						        			<Text style={styles.boldGrey}>{disad.cost}</Text>
						        		</Left>
						        		<Body>
						        			<Text style={styles.grey}>{disad.description}</Text>
						        		</Body>
						        	</ListItem>							
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
		backgroundColor: '#3d6594'
	},
	pointCostsHeader: {
		alignSelf: 'center',
		textDecorationLine: 'underline'
	}
});