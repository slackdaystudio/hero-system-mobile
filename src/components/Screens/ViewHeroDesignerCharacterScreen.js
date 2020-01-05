import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler,Platform, StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, ScrollableTab, Spinner, Text } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import General from '../HeroDesignerCharacter/General';
import Characteristics from '../HeroDesignerCharacter/Characteristics';
import Traits from '../HeroDesignerCharacter/Traits';
import Header from '../Header/Header';
import Slider from '../Slider/Slider';
import { character } from '../../lib/Character';
import styles from '../../Styles';
import { updateForm } from '../../reducers/forms';

// Copyright 2020 Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class ViewHeroDesignerCharacterScreen extends Component {
	static propTypes = {
		character: PropTypes.object.isRequired
	}

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    _renderTab(title, listKey, subListKey) {
        if (this.props.character[listKey].length === 0) {
            return null;
        }

        return (
            <Tab
                tabStyle={styles.tabInactive}
                activeTabStyle={styles.tabActive}
                textStyle={styles.grey}
                activeTextStyle={{color: '#FFF'}}
                heading={title}
            >
                <View style={styles.tabContent}>
                    <Traits
                        navigation={this.props.navigation}
                        headingText={title}
                        character={this.props.character}
                        listKey={listKey}
                        subListKey={subListKey}
                        updateForm={this.props.updateForm}
                    />
                </View>
            </Tab>
        );
    }

	render() {
	    // The Drawer navigator can sometimes pass in an old character to this view by mistake, this
	    // guards against a error
		if (!character.isHeroDesignerCharacter(this.props.character)) {
			return null;
		}

		return (
		  <Container style={styles.container}>
            <NavigationEvents
                onDidFocus={(payload) => this.onDidFocus()}
                onDidBlur={(payload) => this.onDidBlur()}
            />
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
							<Characteristics navigation={this.props.navigation} character={this.props.character} />
						</View>
					</Tab>
                    {this._renderTab('Skills', 'skills', 'skills')}
                    {this._renderTab('Perks', 'perks', 'perks')}
                    {this._renderTab('Talents', 'talents', 'talents')}
                    {this._renderTab('Martial Arts', 'martialArts', 'maneuver')}
                    {this._renderTab('Powers', 'powers', 'powers')}
                    {this._renderTab('Equipment', 'equipment', 'power')}
                    {this._renderTab('Complications', 'disadvantages', 'disadvantages')}
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
        character: state.character.character
    };
}

const mapDispatchToProps = {
    updateForm
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewHeroDesignerCharacterScreen);
