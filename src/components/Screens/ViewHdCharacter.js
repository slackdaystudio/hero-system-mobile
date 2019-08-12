import React, { Component }  from 'react';
import { Platform, StyleSheet, View, ScrollView } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, ScrollableTab, Spinner } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import General from '../HeroDesignerCharacter/General';
import Header from '../Header/Header';
import Slider from '../Slider/Slider';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class ViewCharacterScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
			character: null
		};
	}

	async componentDidMount() {
		let loadedCharacter = await AsyncStorage.getItem('character');

        if (loadedCharacter === null) {
            this.props.navigation.navigate('Home');

            Toast.show({
                text: 'Please load a character first',
                position: 'bottom',
                buttonText: 'OK'
            });

            return;
        }

        let characterJson = JSON.parse(loadedCharacter).character;

		this.setState({character: characterJson});
	}

	render() {
	    if (this.state.character === null) {
	        return (
                <Container style={styles.container}>
                    <Header hasTabs={false} navigation={this.props.navigation} />
                    <Content style={{backgroundColor: '#375476'}}>
                        <Spinner color='#D0D1D3' />
                    </Content>
	            </Container>
	        );
	    }

		return (
		  <Container style={styles.container}>
		  	<Header hasTabs={false} navigation={this.props.navigation} />
		  	<Content scrollEnable={false} style={{backgroundColor: '#375476'}}>
                <Tabs tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={{backgroundColor: '#375476'}} />}>
			  		<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="General">
			  			<View style={styles.tabContent}>
                            <General character={this.state.character.characterInfo} />
			  			</View>
			  		</Tab>
			  	</Tabs>
		  	</Content>
	      </Container>
		);
	}
}

const localStyles = StyleSheet.create({
	pointCostsHeader: {
		alignSelf: 'center',
		textDecorationLine: 'underline'
	},
    button: {
        backgroundColor: '#478f79',
        alignSelf: 'flex-end'
    }
});
