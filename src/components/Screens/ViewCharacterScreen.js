import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Platform, StyleSheet, View, ScrollView } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, TabHeading, ScrollableTab, Spinner, Text } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import General from '../Character/General';
import Combat from '../Character/Combat';
import Characteristics from '../Character/Characteristics';
import Powers from '../Character/Powers';
import Movement from '../Character/Movement';
import TextList from '../Character/TextList';
import Equipment from '../Character/Equipment';
import Header from '../Header/Header';
import Slider from '../Slider/Slider';
import HeroDesignerCharacterFooter from '../HeroDesignerCharacterFooter/HeroDesignerCharacterFooter';
import { character } from '../../lib/Character';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import { updateForm } from '../../reducers/forms';
import { setSparseCombatDetails, selectCharacter, clearCharacter } from '../../reducers/character';

// Copyright 2018-Present Philip J. Guinchard
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

class ViewCharacterScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        characters: PropTypes.object,
        groupPlayMode: PropTypes.number,
        updateForm: PropTypes.func.isRequired,
        setSparseCombatDetails: PropTypes.func.isRequired,
        selectCharacter: PropTypes.func.isRequired,
        clearCharacter: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.tabs = null;
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this._getBackScreen());

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.character !== null && prevProps.character !== null && this.props.character.filename !== prevProps.character.filename) {
            if (this.tabs !== null) {
                this.tabs.goToPage(0);
            }
        }
    }

    _getBackScreen() {
        let backScreen = 'Home';

        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.hasOwnProperty('from')) {
            backScreen = this.props.navigation.state.params.from;
        }

        return backScreen;
    }

    _renderPowers(powers) {
        if (powers === '' || powers === undefined || powers === null) {
            return null;
        }

        return (
            <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Powers')}>
                <View style={styles.tabContent}>
                    <Powers navigation={this.props.navigation} powers={powers} strengthDamage={character.getStrengthDamage(this.props.character)} updateForm={this.props.updateForm}/>
                </View>
            </Tab>
        );
    }

    _renderEquipment(equipment) {
        if (equipment === '' || equipment === undefined || equipment === null) {
            return null;
        }

        return (
            <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Equipment')}>
                <View style={styles.tabContent}>
                    <Equipment navigation={this.props.navigation} equipment={equipment} strengthDamage={character.getStrengthDamage(this.props.character)} updateForm={this.props.updateForm}/>
                </View>
            </Tab>
        );
    }

    _renderTextList(text, columnHeading, tabTitle = null) {
        if (text === '' || text === undefined || text === null) {
            return null;
        }

        return (
            <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading(tabTitle === null ? columnHeading + 's' : tabTitle)}>
                <View style={styles.tabContent}>
                    <TextList text={text} columnHeading={columnHeading} navigation={this.props.navigation} />
                </View>
            </Tab>
        );
    }

    _renderTabHeading(headingText) {
        return (
            <TabHeading style={styles.tabHeading} activeTextStyle={styles.activeTextStyle}>
                <Text style={styles.tabStyle}>
                    {headingText}
                </Text>
            </TabHeading>
        );
    }

    _renderCharacter() {
        // The Drawer navigator can sometimes pass in an old character to this view by mistake, this
        // guards against a error
        if (common.isEmptyObject(this.props.character) || character.isHeroDesignerCharacter(this.props.character)) {
            return <Spinner color="#D0D1D3" />;
        }

        return (
            <Tabs locked={true} ref={component => this.tabs = component} tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={styles.scrollableTab} />}>
                <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('General')}>
                    <View style={styles.tabContent}>
                        <General character={this.props.character} />
                    </View>
                </Tab>
                <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Combat')}>
                    <View style={styles.tabContent}>
                        <Combat
                            navigation={this.props.navigation}
                            character={this.props.character}
                            updateForm={this.props.updateForm}
                            setSparseCombatDetails={this.props.setSparseCombatDetails}
                        />
                    </View>
                </Tab>
                <Tab tabStyle={styles.tabHeading} activeTabStyle={styles.activeTabStyle} activeTextStyle={styles.activeTextStyle} heading={this._renderTabHeading('Characteristics')}>
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
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header hasTabs={false} groupPlayMode={this.props.groupPlayMode} navigation={this.props.navigation} backScreen={this._getBackScreen()} />
                <Content scrollEnable={false} style={{backgroundColor: '#1b1d1f'}}>
                    {this._renderCharacter()}
                </Content>
                <HeroDesignerCharacterFooter
                    navigation={this.props.navigation}
                    character={this.props.character}
                    characters={this.props.characters}
                    selectCharacter={this.props.selectCharacter}
                    clearCharacter={this.props.clearCharacter}
                />
            </Container>
        );
    }
}

const localStyles = StyleSheet.create({
    pointCostsHeader: {
        alignSelf: 'center',
        textDecorationLine: 'underline',
    },
});

const mapStateToProps = state => {
    return {
        character: state.character.character,
        characters: state.character.characters,
        groupPlayMode: state.groupPlay.mode,
    };
};

const mapDispatchToProps = {
    updateForm,
    setSparseCombatDetails,
    selectCharacter,
    clearCharacter,
};

export default connect(mapStateToProps, mapDispatchToProps)(ViewCharacterScreen);
