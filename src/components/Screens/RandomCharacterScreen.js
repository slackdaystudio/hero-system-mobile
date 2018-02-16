import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text, List, ListItem, Left, Body } from 'native-base';
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
		  	<Header navigation={this.props.navigation} />
		  	<Content style={localStyles.content}>
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
	        	<List>
	        		<ListItem itemDivider style={{backgroundColor: '#3a557f'}}>
	        			<Text style={styles.boldGrey}>Characteristics</Text>
	        		</ListItem>
	        	</List>
				{this._renderCharacteristics()}
				<View style={{paddingBottom: 20}} />
	        	<List>
	        		<ListItem itemDivider style={{backgroundColor: '#3a557f'}}>
	        			<Text style={styles.boldGrey}>Powers</Text>
	        		</ListItem>
	        	</List>
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
				<View style={{paddingBottom: 20}} />
	        	<List>
	        		<ListItem itemDivider style={{backgroundColor: '#3a557f'}}>
	        			<Text style={styles.boldGrey}>Skills</Text>
	        		</ListItem>
	        	</List>
				{this.state.character.skills.skills.map((skill, index) => {
					return (
						<ListItem key={'dkill-' + index}>
			        		<Body>
			        			<Text style={styles.grey}>{skill}</Text>
			        		</Body>
			        	</ListItem>							
					);
				})}
				<View style={{paddingBottom: 20}} />
	        	<List>
	        		<ListItem itemDivider style={{backgroundColor: '#3a557f'}}>
	        			<Text style={styles.boldGrey}>Disavantages</Text>
	        		</ListItem>
	        	</List>
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
				<View style={{paddingBottom: 20}} />
				<LabelAndContent label='Characteristics Cost' content={this.state.character.archtype.characteristicsCost} />
				<LabelAndContent label='Skills Cost' content={this.state.character.skills.cost} />
				<LabelAndContent label='Powers Cost' content={this.state.character.powers.powersCost} />
				<LabelAndContent label='Disadvantages Cost' content={this.state.character.disadvantages.disadvantagesCost} />
				<View style={styles.buttonContainer}>
	    			<Button block style={styles.button} onPress={this.reRoll}>
	    				<Text>Roll Again</Text>
	    			</Button>
	    		</View>
	        </Content>
	      </Container>	
		);
	}
}

const localStyles = StyleSheet.create({
	container: {
		backgroundColor: '#446B95'
	},
	content: {
		paddingTop: 10
	}
});