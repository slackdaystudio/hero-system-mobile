import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Dimensions, BackHandler, View, Image} from 'react-native';
import {Container, Content, Tabs, Tab, TabHeading, ScrollableTab, Spinner, Text} from 'native-base';
import {NavigationEvents} from 'react-navigation';
import General from '../HeroDesignerCharacter/General';
import Combat from '../HeroDesignerCharacter/Combat';
import Characteristics from '../HeroDesignerCharacter/Characteristics';
import Traits from '../HeroDesignerCharacter/Traits';
import Notes from '../HeroDesignerCharacter/Notes';
import Header from '../Header/Header';
import HeroDesignerCharacterFooter from '../HeroDesignerCharacterFooter/HeroDesignerCharacterFooter';
import {character} from '../../lib/Character';
import {common} from '../../lib/Common';
import styles from '../../Styles';
import {updateForm, updateFormValue, resetForm} from '../../reducers/forms';
import {
    setShowSecondary,
    selectCharacter,
    setSparseCombatDetails,
    usePhase,
    updateNotes,
    clearCharacter,
    applyStatus,
    clearAllStatuses,
    clearStatus,
} from '../../reducers/character';

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
        characters: PropTypes.object,
        updateForm: PropTypes.func.isRequired,
        updateFormValue: PropTypes.func.isRequired,
        resetForm: PropTypes.func.isRequired,
        setSparseCombatDetails: PropTypes.func.isRequired,
        setShowSecondary: PropTypes.func.isRequired,
        usePhase: PropTypes.func.isRequired,
        updateNotes: PropTypes.func.isRequired,
        selectCharacter: PropTypes.func.isRequired,
        clearCharacter: PropTypes.func.isRequired,
        applyStatus: PropTypes.func.isRequired,
        clearAllStatuses: PropTypes.func.isRequired,
        clearStatus: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            width: 300,
            height: 400,
        };

        this.tabs = null;

        this.backHandler = null;
        this.screenOrientationHandler = null;
    }

    onDidFocus() {
        this._setPortraitDimensions();

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this._getBackScreen());

            return true;
        });

        this.screenOrientationHandler = Dimensions.addEventListener('change', () => {
            this._setPortraitDimensions();
        });
    }

    onDidBlur() {
        this.backHandler.remove();

        Dimensions.removeEventListener('change', this.screenOrientationHandler);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.character !== null && prevProps.character !== null && this.props.character.filename !== prevProps.character.filename) {
            if (this.tabs !== null && this.tabs !== undefined) {
                this.tabs.goToPage(0);
            }

            this._setPortraitDimensions();
        } else if (this.props.character !== null && prevProps.character === null) {
            this._setPortraitDimensions();
        }
    }

    _setPortraitDimensions() {
        if (
            this.props.character === null ||
            this.props.character === undefined ||
            this.props.character.portrait === null ||
            this.props.character.portrait === undefined
        ) {
            return;
        }

        Image.getSize(this.props.character.portrait, (imageWidth, imageHeight) => {
            const {width} = Dimensions.get('window');
            const paddedWidth = width - 40;

            if (imageWidth - paddedWidth > 0) {
                let percentageDecrease = 1 - (imageWidth - paddedWidth) / imageWidth;

                imageWidth = imageWidth * percentageDecrease;
                imageHeight = imageHeight * percentageDecrease;
            }

            this.setState({width: imageWidth, height: imageHeight});
        });
    }

    _getBackScreen() {
        let backScreen = 'Home';

        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.hasOwnProperty('from')) {
            backScreen = this.props.navigation.state.params.from;
        }

        return backScreen;
    }

    _renderTabHeading(headingText) {
        return (
            <TabHeading style={styles.tabHeading} activeTextStyle={styles.activeTextStyle}>
                <Text style={styles.tabStyle}>{headingText}</Text>
            </TabHeading>
        );
    }

    _renderTab(title, listKey, subListKey) {
        if (this.props.character[listKey].length === 0) {
            return null;
        }

        return (
            <Tab
                tabStyle={styles.tabHeading}
                activeTabStyle={styles.activeTabStyle}
                activeTextStyle={styles.activeTextStyle}
                heading={this._renderTabHeading(title)}
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

    _renderCharacter() {
        // The Drawer navigator can sometimes pass in an old character to this view by mistake, this
        // guards against a error
        if (common.isEmptyObject(this.props.character) || !character.isHeroDesignerCharacter(this.props.character)) {
            return <Spinner color="#D0D1D3" />;
        }

        return (
            <Tabs
                locked={true}
                ref={(component) => (this.tabs = component)}
                tabBarUnderlineStyle={styles.tabBarUnderline}
                renderTabBar={() => <ScrollableTab style={styles.scrollableTab} />}
            >
                <Tab
                    tabStyle={styles.tabHeading}
                    activeTabStyle={styles.activeTabStyle}
                    activeTextStyle={styles.activeTextStyle}
                    heading={this._renderTabHeading('General')}
                >
                    <View style={styles.tabContent}>
                        <General
                            characterInfo={this.props.character.characterInfo}
                            portrait={this.props.character.portrait}
                            portraitWidth={this.state.width}
                            portraitHeight={this.state.height}
                        />
                    </View>
                </Tab>
                <Tab
                    tabStyle={styles.tabHeading}
                    activeTabStyle={styles.activeTabStyle}
                    activeTextStyle={styles.activeTextStyle}
                    heading={this._renderTabHeading('Combat')}
                >
                    <View style={styles.tabContent}>
                        <Combat
                            navigation={this.props.navigation}
                            character={this.props.character}
                            characters={this.props.characters}
                            combatDetails={this.props.character.combatDetails}
                            setSparseCombatDetails={this.props.setSparseCombatDetails}
                            forms={this.props.forms}
                            updateForm={this.props.updateForm}
                            updateFormValue={this.props.updateFormValue}
                            resetForm={this.props.resetForm}
                            usePhase={this.props.usePhase}
                            applyStatus={this.props.applyStatus}
                            clearAllStatuses={this.props.clearAllStatuses}
                            clearStatus={this.props.clearStatus}
                        />
                    </View>
                </Tab>
                <Tab
                    tabStyle={styles.tabHeading}
                    activeTabStyle={styles.activeTabStyle}
                    activeTextStyle={styles.activeTextStyle}
                    heading={this._renderTabHeading('Characteristics')}
                >
                    <View style={styles.tabContent}>
                        <Characteristics
                            navigation={this.props.navigation}
                            character={this.props.character}
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
                {this._renderTab('Equipment', 'equipment', 'powers')}
                {this._renderTab('Complications', 'disadvantages', 'disadvantages')}
                <Tab
                    tabStyle={styles.tabHeading}
                    activeTabStyle={styles.activeTabStyle}
                    activeTextStyle={styles.activeTextStyle}
                    heading={this._renderTabHeading('Notes')}
                >
                    <View style={styles.tabContent}>
                        <Notes notes={this.props.character.notes || ''} updateNotes={this.props.updateNotes} />
                    </View>
                </Tab>
            </Tabs>
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents onDidFocus={(payload) => this.onDidFocus()} onDidBlur={(payload) => this.onDidBlur()} />
                <Header hasTabs={false} navigation={this.props.navigation} backScreen={this._getBackScreen()} />
                <Content scrollEnable={false} style={styles.content}>
                    {this._renderCharacter()}
                    <HeroDesignerCharacterFooter
                        navigation={this.props.navigation}
                        character={this.props.character}
                        characters={this.props.characters}
                        selectCharacter={this.props.selectCharacter}
                        clearCharacter={this.props.clearCharacter}
                    />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        character: state.character.character,
        characters: state.character.characters,
        forms: state.forms,
    };
};

const mapDispatchToProps = {
    updateForm,
    updateFormValue,
    resetForm,
    setShowSecondary,
    selectCharacter,
    setSparseCombatDetails,
    usePhase,
    updateNotes,
    clearCharacter,
    applyStatus,
    clearAllStatuses,
    clearStatus,
};

export default connect(mapStateToProps, mapDispatchToProps)(ViewHeroDesignerCharacterScreen);
