import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler,Platform, StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Container, Content, Toast, Tabs, Tab, ScrollableTab, Spinner, Text } from 'native-base';
import { NavigationEvents } from 'react-navigation';
import General from '../HeroDesignerCharacter/General';
import Combat from '../HeroDesignerCharacter/Combat';
import Characteristics from '../HeroDesignerCharacter/Characteristics';
import Traits from '../HeroDesignerCharacter/Traits';
import Header from '../Header/Header';
import Slider from '../Slider/Slider';
import { character } from '../../lib/Character';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import { updateForm } from '../../reducers/forms';
import { setCombatDetails, setSparseCombatDetails, usePhase } from '../../reducers/combat';
import { setShowSecondary } from '../../reducers/character';

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

class ViewHeroDesignerCharacterScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
        showSecondary: PropTypes.bool.isRequired,
        combatDetails: PropTypes.object.isRequired,
        updateForm: PropTypes.func.isRequired,
        setCombatDetails: PropTypes.func.isRequired,
        setSparseCombatDetails: PropTypes.func.isRequired,
        setShowSecondary: PropTypes.func.isRequired,
        usePhase: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.tabs = null;
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this.props.navigation.state.params.from || 'Home');

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.character !== prevProps.character) {
            if (this.tabs !== null) {
                this.tabs.goToPage(0);
            }
        }
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
                        showSecondary={this.props.showSecondary}
                        listKey={listKey}
                        subListKey={subListKey}
                        updateForm={this.props.updateForm}
                    />
                </View>
            </Tab>
        );
    }

    _renderCharacter() {
        // The Drawer navigator can sometimes pass in an old character to this view by mistake, this
        // guards against a error
        if (common.isEmptyObject(this.props.character) || !character.isHeroDesignerCharacter(this.props.character)) {
            return <Spinner color="#D0D1D3" />;
        }

        return (
            <Tabs ref={component => this.tabs = component} tabBarUnderlineStyle={styles.tabBarUnderline} renderTabBar={()=> <ScrollableTab style={{backgroundColor: '#000'}} />}>
                <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="General">
                    <View style={styles.tabContent}>
                        <General characterInfo={this.props.character.characterInfo} />
                    </View>
                </Tab>
                <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Combat">
                    <View style={styles.tabContent}>
                        <Combat
                            navigation={this.props.navigation}
                            character={this.props.character}
                            showSecondary={this.props.showSecondary}
                            combatDetails={this.props.combatDetails}
                            setSparseCombatDetails={this.props.setSparseCombatDetails}
                            forms={this.props.forms}
                            updateForm={this.props.updateForm}
                            usePhase={this.props.usePhase}
                        />
                    </View>
                </Tab>
                <Tab tabStyle={styles.tabInactive} activeTabStyle={styles.tabActive} textStyle={styles.grey} activeTextStyle={{color: '#FFF'}} heading="Characteristics">
                    <View style={styles.tabContent}>
                        <Characteristics
                            navigation={this.props.navigation}
                            character={this.props.character}
                            showSecondary={this.props.showSecondary}
                            setCombatDetails={this.props.setCombatDetails}
                            setShowSecondary={this.props.setShowSecondary}
                            updateForm={this.props.updateForm}
                        />
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
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header hasTabs={false} navigation={this.props.navigation} />
                <Content scrollEnable={false} style={styles.content}>
                    {this._renderCharacter()}
                </Content>
            </Container>
        );
    }
}

const localStyles = StyleSheet.create({
    pointCostsHeader: {
        alignSelf: 'center',
        textDecorationLine: 'underline',
    },
    button: {
        backgroundColor: '#478f79',
        alignSelf: 'flex-end',
    },
});

const mapStateToProps = state => {
    return {
        character: state.character.character,
        showSecondary: state.character.showSecondary,
        combatDetails: state.combat,
        forms: state.forms,
    };
};

const mapDispatchToProps = {
    updateForm,
    setShowSecondary,
    setCombatDetails,
    setSparseCombatDetails,
    usePhase,
};

export default connect(mapStateToProps, mapDispatchToProps)(ViewHeroDesignerCharacterScreen);
