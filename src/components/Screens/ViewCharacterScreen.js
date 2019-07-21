import React, { Component }  from 'react';
import { Platform, StyleSheet, View, ScrollView } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, ScrollableTab, Spinner } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import General from '../Character/General';
import Combat from '../Character/Combat';
import Characteristics from '../Character/Characteristics';
import Powers from '../Character/Powers';
import Movement from '../Character/Movement';
import TextList from '../Character/TextList';
import Equipment from '../Character/Equipment';
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

    _renderPowers(powers) {
        if (powers === '' || powers === undefined || powers === null) {
            return null;
        }

        return (
            <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading='Powers'>
                <View style={styles.tabContent}>
                    <Powers navigation={this.props.navigation} powers={powers} strengthDamage={character.getStrengthDamage(this.state.character)} />
                </View>
            </Tab>
        );
    }

    _renderEquipment(equipment) {
        if (equipment === '' || equipment === undefined || equipment === null) {
            return null;
        }

        return (
            <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading='Equipment'>
                <View style={styles.tabContent}>
                    <Equipment navigation={this.props.navigation} equipment={equipment} strengthDamage={character.getStrengthDamage(this.state.character)}/>
                </View>
            </Tab>
        );
    }

    _renderTextList(text, columnHeading, tabTitle = null) {
        if (text === '' || text === undefined || text === null) {
            return null;
        }

        return (
            <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading={tabTitle === null ? columnHeading + 's' : tabTitle}>
			    <View style={styles.tabContent}>
			        <TextList text={text} columnHeading={columnHeading} navigation={this.props.navigation} />
			    </View>
			</Tab>
        );
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
                <Tabs tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
			  		<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="General">
			  			<View style={styles.tabContent}>
                            <General character={this.state.character} />
			  			</View>
			  		</Tab>
                    <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Combat">
			  			<View style={styles.tabContent}>
                            <Combat navigation={this.props.navigation} character={this.state.character} />
			  		    </View>
			  		</Tab>
			  		<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Characteristics">
			  		    <View style={styles.tabContent}>
			  		        <Characteristics characteristics={this.state.character.characteristics.characteristic} navigation={this.props.navigation} />
			  		        <Movement movement={this.state.character.movement} />
			  		    </View>
			  		</Tab>
                    {this._renderPowers(this.state.character.powers.text)}
			  		{this._renderEquipment(this.state.character.equipment.text)}
                    {this._renderTextList(this.state.character.martialArts.text, 'Maneuver', 'Martial Arts')}
                    {this._renderTextList(this.state.character.skills.text, 'Skill')}
                    {this._renderTextList(this.state.character.talents.text, 'Talent')}
                    {this._renderTextList(this.state.character.perks.text, 'Perk')}
                    {this._renderTextList(this.state.character.disadvantages.text, 'Disadvantage')}
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
