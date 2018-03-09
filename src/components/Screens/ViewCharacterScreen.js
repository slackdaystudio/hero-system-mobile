import React, { Component }  from 'react';
import { Platform, StyleSheet, ScrollView, AsyncStorage } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, ScrollableTab, Spinner } from 'native-base';
import General from '../Character/General';
import Combat from '../Character/Combat';
import Characteristics from '../Character/Characteristics';
import Powers from '../Character/Powers';
import Movement from '../Character/Movement';
import TextList from '../Character/TextList';
import Equipment from '../Character/Equipment';
import Header from '../Header/Header';
import Slider from '../Slider/Slider';
import styles from '../../Styles';

export default class ViewCharacterScreen extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			character: null
		};
	}
	
	async componentWillMount() {
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
            <Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading='Powers'>
                <ScrollView style={localStyles.tabContent}>
                    <Powers powers={powers} />
                </ScrollView>
            </Tab>
        );
    }

    _renderEquipment(equipment) {
        if (equipment === '' || equipment === undefined || equipment === null) {
            return null;
        }

        return (
            <Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading='Equipment'>
                <ScrollView style={localStyles.tabContent}>
                    <Equipment equipment={equipment} />
                </ScrollView>
            </Tab>
        );
    }

    _renderTextList(text, columnHeading, tabTitle = null) {
        if (text === '' || text === undefined || text === null) {
            return null;
        }

        return (
            <Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading={tabTitle === null ? columnHeading + 's' : tabTitle}>
			    <ScrollView style={localStyles.tabContent}>
			        <TextList text={text} columnHeading={columnHeading} navigation={this.props.navigation} />
			    </ScrollView>
			</Tab>
        );
    }

	render() {
	    if (this.state.character === null) {
	        return (
                <Container>
                    <Header hasTabs={false} navigation={this.props.navigation} />
                    <Content style={{backgroundColor: '#375476', paddingTop: 10}}>
                        <Spinner color='#D0D1D3' />
                    </Content>
	            </Container>
	        );
	    }

		return (
		  <Container style={localStyles.container}>
		  	<Header hasTabs={false} navigation={this.props.navigation} />
		  	<Content style={{backgroundColor: '#375476', paddingTop: Platform.OS === 'ios' ? 0 : 10}}>
                <Tabs tabBarUnderlineStyle={localStyles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="General">
			  			<ScrollView style={localStyles.tabContent}>
                            <General character={this.state.character} />
			  			</ScrollView>
			  		</Tab>
                    <Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Combat">
			  			<ScrollView style={localStyles.tabContent}>
                            <Combat character={this.state.character} />
			  		    </ScrollView>
			  		</Tab>
			  		<Tab tabStyle={localStyles.tabInactive} activeTabStyle={localStyles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Characteristics">
			  		    <ScrollView style={localStyles.tabContent}>
			  		        <Characteristics characteristics={this.state.character.characteristics.characteristic} navigation={this.props.navigation} />
			  		        <Movement movement={this.state.character.movement} />
			  		    </ScrollView>
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
	},
    button: {
        backgroundColor: '#478f79',
        alignSelf: 'flex-end'
    }
});
