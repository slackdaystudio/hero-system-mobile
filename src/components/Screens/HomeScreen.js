import React, { Component }  from 'react';
import { StyleSheet, View, ImageBackground } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class HomeScreen extends Component {
	render() {
		return (
		  <Container style={styles.container}>
			<Header navigation={this.props.navigation} />
			<ImageBackground source={require('../../../public/background.png')} style={{flex: 1}}>
	        <Content style={styles.content}>
				<View>
					<Text style={styles.heading}>Character Tools</Text>
					<Text style={styles.grey}>Import characters from Hero Designer and take them with you when you're on the go.</Text>
					<View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => character.load()}>
                                <Text style={styles.buttonText}>Load</Text>
                            </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('ViewCharacter')}>
                                <Text style={styles.buttonText}>View</Text>
                            </Button>
                        </View>
		    		</View>
					<Text style={styles.heading}>Roll 'em</Text>
					<Text style={styles.grey}>Use these tools for rolling dice and doing common tasks within the Hero system.</Text>
					<View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
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
		    		</View>
		    		<View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
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
					<Text style={styles.heading}>H.E.R.O.</Text>
					<Text style={styles.grey}>Generate a random character using the Heroic Empowerment Resource Organizer (H.E.R.O.) tool.  Great for brainstorming new character ideas or one shot adventures.</Text>
					<View style={styles.buttonContainer}>
		    			<Button style={styles.button} onPress={() => this.props.navigation.navigate('RandomCharacter')}>
		    				<Text style={styles.buttonText}>H.E.R.O.</Text>
		    			</Button>
		    		</View>
		      	</View>
	        </Content>
	        </ImageBackground>
	      </Container>	
		);
	}
}