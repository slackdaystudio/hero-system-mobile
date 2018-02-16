import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import styles from '../../Styles';

export default class HomeScreen extends Component {
	render() {
		return (
		  <Container style={styles.container}>
			<Header />  
	        <Content style={styles.content}>
				<View>
					<Text style={styles.heading}>Random Super</Text>
					<Text style={styles.grey}>Generate a random character.  Great for brainstorming new character ideas or one shot adventures.</Text>
					<View style={styles.buttonContainer}>
		    			<Button style={styles.button} onPress={() => this.props.navigation.navigate('RandomCharacter')}>
		    				<Text style={styles.buttonText}>Randomize!</Text>
		    			</Button>
		    		</View>						
					<Text style={styles.heading}>Die Rollers</Text>
					<Text style={styles.grey}>Tools for rolling dice and doing common tasks within the Hero system.</Text>
					<View style={styles.buttonContainer}>
		    			<Button style={styles.button} onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck())}>
		    				<Text style={styles.buttonText}>3d6</Text>
		    			</Button>
		    		</View>
		    		<View style={styles.buttonContainer}>
		    			<Button style={styles.button} onPress={() => this.props.navigation.navigate('Hit')}>
		    				<Text style={styles.buttonText}>Hit</Text>
		    			</Button>
		    		</View>
			    	<View style={styles.buttonContainer}>
		    			<Button style={styles.button} onPress={() => this.props.navigation.navigate('Damage')}>
		    				<Text style={styles.buttonText}>Damage</Text>
		    			</Button>
		    		</View>	
			    	<View style={styles.buttonContainer}>
		    			<Button style={styles.button} onPress={() => this.props.navigation.navigate('FreeForm')}>
		    				<Text style={styles.buttonText}>Free Form</Text>
		    			</Button>
		    		</View>
		      	</View>
	        </Content>
	      </Container>	
		);
	}
}