import React, { Component }  from 'react';
import { Platform, StyleSheet, ScrollView, View, ImageBackground } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import Header from '../Header/Header';
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class HomeScreen extends Component {
	render() {
		return (
		  <Container style={styles.container}>
		    <ImageBackground source={require('../../../public/background.png')} style={{flex: 1}} imageStyle={{ resizeMode: 'cover' }}>
			    <Header navigation={this.props.navigation} />
                <Content style={styles.content}>
                    <Text style={styles.heading}>Character</Text>
                    <Text style={styles.grey}>Import characters from Hero Designer and take them with you when you're on the go.</Text>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('ViewCharacter')}>
                                <Text uppercase={false} style={styles.buttonText}>View</Text>
                            </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => character.load()}>
                                <Text uppercase={false} style={styles.buttonText}>Load</Text>
                            </Button>
                        </View>
                    </View>
                    <Text style={styles.heading}>Rolls</Text>
                    <Text style={styles.grey}>Use these tools for rolling dice and doing common tasks within the Hero system.</Text>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('Skill')}>
                                <Text uppercase={false} style={styles.buttonText}>3d6</Text>
                            </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('Hit')}>
                                <Text uppercase={false} style={styles.buttonText}>Hit</Text>
                            </Button>
                        </View>
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('Damage')}>
                                <Text uppercase={false} style={styles.buttonText}>Damage</Text>
                            </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('FreeForm')}>
                                <Text uppercase={false} style={styles.buttonText}>Free Form</Text>
                            </Button>
                        </View>
                    </View>
                    <Text style={styles.heading}>Tools</Text>
                    <Text style={styles.grey}>Generate a random 5e character using the Heroic Empowerment Resource Organizer (H.E.R.O.) tool or use the cruncher to calculate power costs.</Text>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={[styles.buttonContainer, {paddingBottom: 20}]}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('RandomCharacter')}>
                                <Text uppercase={false} style={styles.buttonText}>H.E.R.O.</Text>
                            </Button>
                        </View>
                        <View style={[styles.buttonContainer, {paddingBottom: 20}]}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('CostCruncher')}>
                                <Text uppercase={false} style={styles.buttonText}>Cruncher</Text>
                            </Button>
                        </View>
                    </View>
                </Content>
            </ImageBackground>
	      </Container>
		);
	}
}
