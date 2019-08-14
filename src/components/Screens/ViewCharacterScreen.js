import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { Platform, StyleSheet, View, ScrollView } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, ScrollableTab, Spinner, Text } from 'native-base';
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
import { common } from '../../lib/Common';
import styles from '../../Styles';

class ViewCharacterScreen extends Component {
    _renderPowers(powers) {
        if (powers === '' || powers === undefined || powers === null) {
            return null;
        }

        return (
            <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading='Powers'>
                <View style={styles.tabContent}>
                    <Powers navigation={this.props.navigation} powers={powers} strengthDamage={character.getStrengthDamage(this.props.character)} />
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
                    <Equipment navigation={this.props.navigation} equipment={equipment} strengthDamage={character.getStrengthDamage(this.props.character)}/>
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
	    if (common.isEmptyObject(this.props.character)) {
	        return (
                <Container style={styles.container}>
                    <Header hasTabs={false} navigation={this.props.navigation} />
                    <Content style={{backgroundColor: '#1b1d1f'}}>
                        <Spinner color='#D0D1D3' />
                    </Content>
	            </Container>
	        );
	    }

		return (
		  <Container style={styles.container}>
		  	<Header hasTabs={false} navigation={this.props.navigation} />
		  	<Content scrollEnable={false} style={{backgroundColor: '#1b1d1f'}}>
                <Tabs tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab />}>
			  		<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="General">
			  			<View style={styles.tabContent}>
                            <General character={this.props.character} />
			  			</View>
			  		</Tab>
                    <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Combat">
			  			<View style={styles.tabContent}>
                            <Combat navigation={this.props.navigation} character={this.props.character} />
			  		    </View>
			  		</Tab>
			  		<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Characteristics">
			  		    <View style={styles.tabContent}>
			  		        <Characteristics characteristics={this.props.character.characteristics.characteristic} navigation={this.props.navigation} />
			  		        <Movement movement={this.props.character.movement} />
			  		    </View>
			  		</Tab>
                    {this._renderPowers(this.props.character.powers.text)}
			  		{this._renderEquipment(this.props.character.equipment.text)}
                    {this._renderTextList(this.props.character.martialArts.text, 'Maneuver', 'Martial Arts')}
                    {this._renderTextList(this.props.character.skills.text, 'Skill')}
                    {this._renderTextList(this.props.character.talents.text, 'Talent')}
                    {this._renderTextList(this.props.character.perks.text, 'Perk')}
                    {this._renderTextList(this.props.character.disadvantages.text, 'Disadvantage')}
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
	}
});

const mapStateToProps = state => {
    return {
        character: state.character
    };
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(ViewCharacterScreen);
