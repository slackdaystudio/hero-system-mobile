import React, { Component }  from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Button, Text, Header, Left, Right, Icon } from 'native-base';

export default class MyHeader extends Component {
	render() {
		return (
			<Header style={localStyles.header}>
		  	  <Left>
				<View style={localStyles.logo}>
					<Image source={require('../../../public/hero_logo.png')} />
				</View>
		  	  </Left>
	          <Right>
	            <Button transparent>
	              <Icon name='menu' />
	            </Button>
	          </Right>
	        </Header>	
		);
	}
}

const localStyles = StyleSheet.create({
	header: {
		backgroundColor: '#3C6591',
		minHeight: 70
	},
	logo: {
		paddingLeft: 15,
		alignSelf: 'center'
	}
});