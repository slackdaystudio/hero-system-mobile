import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Platform, StyleSheet, View, ScrollView } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, ScrollableTab, Spinner, Text } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import General from '../HeroDesignerCharacter/General';
import Characteristics from '../HeroDesignerCharacter/Characteristics';
import Skills from '../HeroDesignerCharacter/Skills';
import Header from '../Header/Header';
import Slider from '../Slider/Slider';
import { character } from '../../lib/Character';
import styles from '../../Styles';

class ViewHeroDesignerCharacterScreen extends Component {
	static propTypes = {
		character: PropTypes.object.isRequired
	}

	render() {
		if (character === null) {
			return null;
		}

		return (
		  <Container style={styles.container}>
		  	<Header hasTabs={false} navigation={this.props.navigation} />
		  	<Content scrollEnable={false} style={styles.content}>
                <Tabs tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={{backgroundColor: '#000'}} />}>
			  		<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="General">
			  			<View style={styles.tabContent}>
                            <General characterInfo={this.props.character.characterInfo} />
			  			</View>
			  		</Tab>
					<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Characteristics">
						<View style={styles.tabContent}>
							<Characteristics navigation={this.props.navigation} characteristics={this.props.character.characteristics} movement={this.props.character.movement} />
						</View>
					</Tab>
					<Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Skills">
						<View style={styles.tabContent}>
							<Skills navigation={this.props.navigation} skills={this.props.character.skills} />
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

const mapStateToProps = state => {
    return {
        character: state.character
    };
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(ViewHeroDesignerCharacterScreen);
