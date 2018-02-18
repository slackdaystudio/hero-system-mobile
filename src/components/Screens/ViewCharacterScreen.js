import React, { Component }  from 'react';
import { StyleSheet, View, Image, ScrollView, AsyncStorage, Alert } from 'react-native';
import { Container, Content, Button, Text, List, ListItem, Left, Body, Tabs, Tab, ScrollableTab } from 'native-base';
import { randomCharacter } from '../../lib/RandomCharacter';
import LabelAndContent from '../LabelAndContent/LabelAndContent';
import Header from '../Header/Header';
import RNFS from 'react-native-fs';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class ViewCharacterScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			character: null
		}
	}
	
	componentDidMount() {
		AsyncStorage.getItem('characterFile').then((characterFile) => {
			characterFile = JSON.parse(characterFile);
			
			RNFS.readFileAssets(characterFile.uri).then(file => {
				this.setState({character: file});
	        });
//			Expo.FileSystem.readAsStringAsync(Expo.FileSystem.documentDirectory + '/Edward.XML').then((xml) => {
//				
//			});
	    }).done();
	}
		
	render() {
		return (
		  <Container style={localStyles.container}>
		  	<Header hasTabs={false} navigation={this.props.navigation} />
		  	<Content style={{backgroundColor: '#375476', paddingTop: 10}}>
		  		<Text>{this.state.character}</Text>
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