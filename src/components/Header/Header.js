import React, { Component }  from 'react';
import { Platform, StyleSheet, View, Image, TouchableHighlight, StatusBar } from 'react-native';
import { Button, Text, Header, Left, Right, Icon } from 'native-base';
import { common } from '../../lib/Common';

export default class MyHeader extends Component {
	render() {
		return (
			<View>
                <Header hasTabs={this.props.hasTabs || false} style={localStyles.header}>
                  <Left>
                    <View style={localStyles.logo}>
                        <TouchableHighlight underlayColor='#3da0ff' onPress={() => this.props.navigation.navigate('Home')}>
                            <Image source={require('../../../public/hero_mobile_logo.png')} />
                        </TouchableHighlight>
                    </View>
                  </Left>
                  <Right>
                    <Button transparent onPress={() => this.props.navigation.navigate("DrawerOpen")}>
                      <Icon name='menu' style={{color: 'white', paddingBottom: Platform.OS === 'ios' ? 50 : 0}} />
                    </Button>
                  </Right>
                </Header>
				<StatusBar backgroundColor='#000' barStyle='light-content' />
		    </View>
		);
	}
}

const localStyles = StyleSheet.create({
	header: {
		backgroundColor: '#000',
		height: Platform.OS === 'ios' ? 60 : 70,
	},
	logo: {
		paddingLeft: 5,
		alignSelf: 'flex-start',
		...Platform.select({
		    ios: {
			    paddingBottom: 20
		    }
		})
	}
});
