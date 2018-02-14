import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Container, Header, Title, Content, Footer, FooterTab, Button, Left, Right, Body, Icon, Text } from 'native-base';
import { dieRoller } from '../../lib/DieRoller';

export default class HomeScreen extends Component {
	render() {
		return (
		  <Container style={styles.container}>
	        <Content>
				<View style={styles.logo}>
					<Image source={require('../../../public/hero_logo.png')} />
				</View>
				<View style={styles.content}>
					<Text style={styles.heading}>Random Super</Text>
					<View style={styles.buttonContainer}>
		    			<Button block onPress={() => this.props.navigation.navigate('Hit')}>
		    				<Text>Randomize!</Text>
		    			</Button>
		    		</View>						
					<Text style={styles.heading}>Die Rollers</Text>
					<View style={styles.buttonContainer}>
		    			<Button block onPress={() => this.props.navigation.navigate('Result', dieRoller.rollCheck())}>
		    				<Text>3d6</Text>
		    			</Button>
		    		</View>
		    		<View style={styles.buttonContainer}>
		    			<Button block onPress={() => this.props.navigation.navigate('Hit')}>
		    				<Text>Hit</Text>
		    			</Button>
		    		</View>
			    	<View style={styles.buttonContainer}>
		    			<Button block onPress={() => this.props.navigation.navigate('Damage')}>
		    				<Text>Damage</Text>
		    			</Button>
		    		</View>	
			    	<View style={styles.buttonContainer}>
		    			<Button block onPress={() => this.props.navigation.navigate('Free Form')}>
		    				<Text>Free Form</Text>
		    			</Button>
		    		</View>
		      	</View>
	        </Content>
	      </Container>	
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#3C6591',
		justifyContent: 'space-around',
		paddingHorizontal: 15
	},
	heading: {
		fontSize: 30,
		fontWeight: 'bold',
		color: '#D0D1D3'
	},
	logo: {
		flex: 1,
		paddingVertical: 15,
		alignSelf: 'center'
	},
	content: {
		flex: 10
	},
	buttonContainer: {
		paddingVertical: 5
	}
});