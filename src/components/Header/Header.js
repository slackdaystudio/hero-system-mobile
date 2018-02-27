import React, { Component }  from 'react';
import { Dimensions, Platform, StyleSheet, View, Image, TouchableHighlight } from 'react-native';
import { Button, Text, Header, Left, Right, Icon } from 'native-base';

export default class MyHeader extends Component {
	_renderSpacer() {
	    let {height, width} = Dimensions.get('window');

	    if (Platform.OS === 'ios' && height / width <= 1.6) {
		    return <View style={{paddingBottom: 20}} />
	    }

	    return null;
	}

	render() {
		return (
			<View>
                <Header hasTabs={this.props.hasTabs || false} style={localStyles.header}>
                  <Left>
                    <View style={localStyles.logo}>
                        <TouchableHighlight underlayColor='#3da0ff' onPress={() => this.props.navigation.navigate('Home')}>
                            <Image source={require('../../../public/hero_logo.png')} />
                        </TouchableHighlight>
                    </View>
                  </Left>
                  <Right>
                    <Button transparent onPress={() => this.props.navigation.navigate("DrawerOpen")}>
                      <Icon name='menu' style={{color: 'white', paddingBottom: Platform.OS === 'ios' ? 15 : 0}} />
                    </Button>
                  </Right>
                </Header>
		        {this._renderSpacer()}
		    </View>
		);
	}
}

const localStyles = StyleSheet.create({
	header: {
		backgroundColor: '#3C6591',
		minHeight: Platform.OS === 'ios' ? 60 : 70,
	},
	logo: {
		paddingLeft: 15,
		alignSelf: 'center',
		...Platform.select({
		    ios: {
			    paddingBottom: 20
		    }
		})
	}
});
