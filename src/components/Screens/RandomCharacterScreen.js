import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShakeEvent from 'react-native-shake-event';
import { randomCharacter } from '../../lib/RandomCharacter';
import LabelAndContent from '../LabelAndContent/LabelAndContent';
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
				<LabelAndContent key={prop} label={prop.toUpperCase()} content={this.state.character.archtype.characteristics[prop]} />
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
		  <Container style={styles.container}>
	        <Content>
				<View style={styles.logo}>
					<Image source={require('../../../public/hero_logo.png')} />
				</View>
				<LabelAndContent label='Archtype' content={this.state.character.archtype.name} />
				<LabelAndContent label='Gender' content={this.state.character.gender} />
				<LabelAndContent label='Special FX' content={this.state.character.specialFx} />
				<LabelAndContent label='Profession' content={this.state.character.skills.profession} />
				<View style={{paddingBottom: 20}} />
				<Text style={styles.boldGrey}>Characteristics</Text>
				{this._renderCharacteristics()}
				<View style={{paddingBottom: 20}} />
				<Text style={styles.boldGrey}>Powers</Text>
				{this.state.character.powers.powers.map((power, index) => {
					return <Text key={'power-' + index} style={styles.grey}>{power.cost} - {power.power}</Text>;
				})}
				<View style={{paddingBottom: 20}} />
				<Text style={styles.boldGrey}>Skills</Text>
				{this.state.character.skills.skills.map((skill, index) => {
					return <Text key={'skill-' + index} style={styles.grey}>{skill}</Text>
				})}
				<View style={{paddingBottom: 20}} />
				<Text style={styles.boldGrey}>Disadvantages</Text>
				{this.state.character.disadvantages.disadvantages.map((disad, index) => {
					return <Text key={'disad-' + index} style={styles.grey}>{disad.cost} - {disad.description}</Text>
				})}
				<View style={{paddingBottom: 20}} />
				<LabelAndContent label='Characteristics Cost' content={this.state.character.archtype.characteristicsCost} />
				<LabelAndContent label='Skills Cost' content={this.state.character.skills.cost} />
				<LabelAndContent label='Powers Cost' content={this.state.character.powers.powersCost} />
				<LabelAndContent label='Disadvantages Cost' content={this.state.character.disadvantages.disadvantagesCost} />
				<View style={styles.buttonContainer}>
	    			<Button block onPress={this.reRoll}>
	    				<Text>Roll Again</Text>
	    			</Button>
	    		</View>
	        </Content>
	      </Container>	
		);
	}
}