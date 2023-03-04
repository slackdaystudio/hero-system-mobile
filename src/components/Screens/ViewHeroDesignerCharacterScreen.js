import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Dimensions, Image} from 'react-native';
import {View, Text} from 'native-base';
import {TabView} from 'react-native-tab-view';
import {Tab, RouteBuilder} from '../Tab/Tab';
import General from '../HeroDesignerCharacter/General';
import Combat from '../HeroDesignerCharacter/Combat';
import Characteristics from '../HeroDesignerCharacter/Characteristics';
import Traits from '../HeroDesignerCharacter/Traits';
import Notes from '../HeroDesignerCharacter/Notes';
import Header from '../Header/Header';
import HeroDesignerCharacterFooter from '../HeroDesignerCharacterFooter/HeroDesignerCharacterFooter';
import {common} from '../../lib/Common';
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
import styles from '../../Styles';

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

const windowWidth = Dimensions.get('window').width;

const windowHeight = Dimensions.get('window').height;

const buildRoutes = (character) => {
    if (common.isEmptyObject(character)) {
        return [];
    }

    const r = [
        {key: 'general', title: 'General'},
        {key: 'combat', title: 'Combat'},
        {key: 'characteristics', title: 'Characteristics'},
        {key: 'skills', title: 'Skills'},
    ];

    if (character.perks.length > 0) {
        r.push({key: 'perks', title: 'Perks'});
    }

    if (character.talents.length > 0) {
        r.push({key: 'talents', title: 'Talents'});
    }

    if (character.martialArts.length > 0) {
        r.push({key: 'martialArts', title: 'Martial Arts'});
    }

    if (character.powers.length > 0) {
        r.push({key: 'powers', title: 'Powers'});
    }

    if (character.equipment.length > 0) {
        r.push({key: 'equipment', title: 'Equipment'});
    }

    r.push({key: 'complications', title: 'Disadvantages'});
    r.push({key: 'notes', title: 'Notes'});

    return r;
};

const GeneralRoute = (props, width, height) => {
    return RouteBuilder(
        'General',
        <General characterInfo={props.character.characterInfo} portrait={props.character.portrait} portraitWidth={width} portraitHeight={height} />,
        common.isEmptyObject(props.character),
    );
};

const CombatRoute = (props) => {
    return RouteBuilder(
        'Combat',
        <Combat
            navigation={props.navigation}
            character={props.character}
            characters={props.characters}
            combatDetails={props.character.combatDetails}
            setSparseCombatDetails={props.setSparseCombatDetails}
            forms={props.forms}
            updateForm={props.updateForm}
            updateFormValue={props.updateFormValue}
            resetForm={props.resetForm}
            usePhase={props.usePhase}
            applyStatus={props.applyStatus}
            clearAllStatuses={props.clearAllStatuses}
            clearStatus={props.clearStatus}
        />,
        common.isEmptyObject(props.character),
    );
};

const CharacteristicsRoute = (props) => {
    return RouteBuilder(
        'Characteristics',
        <Characteristics navigation={props.navigation} character={props.character} setShowSecondary={props.setShowSecondary} updateForm={props.updateForm} />,
        common.isEmptyObject(props.character),
    );
};

const SkillsRoute = (props, render) => {
    return RouteBuilder('Skills', render('Skills', 'skills', 'skills'), common.isEmptyObject(props.character));
};

const PerksRoute = (props, render) => {
    return RouteBuilder('Perks', render('Perks', 'perks', 'perks'), common.isEmptyObject(props.character));
};

const TalentsRoute = (props, render) => {
    return RouteBuilder('Talents', render('Talents', 'talents', 'talents'), common.isEmptyObject(props.character));
};

const MartialArtsRoute = (props, render) => {
    return RouteBuilder('Martial Arts', render('Martial Arts', 'martialArts', 'maneuver'), common.isEmptyObject(props.character));
};

const PowersRoute = (props, render) => {
    return RouteBuilder('Powers', render('Powers', 'powers', 'talents'), common.isEmptyObject(props.character));
};

const EquipmentRoute = (props, render) => {
    return RouteBuilder('Equipment', render('Equipment', 'equipment', 'powers'), common.isEmptyObject(props.character));
};

const ComplicationsRoute = (props, render) => {
    return RouteBuilder('Complications', render('Complications', 'disadvantages', 'disadvantages'), common.isEmptyObject(props.character));
};

const NotesRoute = (props) => {
    return RouteBuilder('Notes', <Notes notes={props.character.notes || ''} updateNotes={props.updateNotes} />, common.isEmptyObject(props.character));
};

const LazyPlaceholder = ({route}) => (
    <View style={{flex: 1, backgroundColor: '#1b1d1f'}}>
        <Text style={[styles.grey, {textAlign: 'center'}]}>Loading {route.title}...</Text>
    </View>
);

class ViewHeroDesignerCharacterScreen extends Component {
    static propTypes = {
        route: PropTypes.object.isRequired,
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
            index: 0,
            routes: buildRoutes(props.character),
            width: 300,
            height: 400,
        };

        this.setIndex = this._setIndex.bind(this);
        this.renderTab = this._renderTab.bind(this);
        this.backHandler = null;
        this.screenOrientationHandler = null;
        this.renderScene = this._renderScene.bind(this);
        this.setPortraitDimensions = this._setPortraitDimensions.bind(this);
    }

    componentDidMount() {
        this._unsubscribe = this.props.navigation.addListener('focus', this.setPortraitDimensions);

        this._dimensionsSubscription = Dimensions.addEventListener('change', this.setPortraitDimensions);
    }

    componentWillUnmount() {
        this._unsubscribe();

        this._dimensionsSubscription?.remove();
    }

    componentDidUpdate(prevProps) {
        if (!common.isEmptyObject(this.props.character)) {
            if (common.isEmptyObject(prevProps.character) || this.props.character.filename !== prevProps.character.filename) {
                this._setPortraitDimensions();
            }
        }
    }

    _setIndex(index) {
        const newState = {...this.state};

        newState.index = index;

        this.setState(newState);
    }

    _setPortraitDimensions() {
        if (common.isEmptyObject(this.props.character) || common.isEmptyObject(this.props.character.portrait)) {
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

    _renderTab(title, listKey, subListKey) {
        if (this.props.character[listKey].length === 0) {
            return null;
        }

        return (
            <Traits
                navigation={this.props.navigation}
                headingText={title}
                character={this.props.character}
                listKey={listKey}
                subListKey={subListKey}
                updateForm={this.props.updateForm}
            />
        );
    }

    _renderScene() {
        const indexSceneLookup = new Map(this.state.routes.map((route, i) => [i, route.key]));

        switch (indexSceneLookup.get(this.state.index)) {
            case 'general':
                return GeneralRoute(this.props, this.state.width, this.state.height);
            case 'combat':
                return CombatRoute(this.props);
            case 'characteristics':
                return CharacteristicsRoute(this.props);
            case 'skills':
                return SkillsRoute(this.props, this.renderTab);
            case 'perks':
                return PerksRoute(this.props, this.renderTab);
            case 'talents':
                return TalentsRoute(this.props, this.renderTab);
            case 'martialArts':
                return MartialArtsRoute(this.props, this.renderTab);
            case 'powers':
                return PowersRoute(this.props, this.renderTab);
            case 'equipment':
                return EquipmentRoute(this.props, this.renderTab);
            case 'complications':
                return ComplicationsRoute(this.props, this.renderTab);
            case 'notes':
                return NotesRoute(this.props);
            default:
                return null;
        }
    }

    render() {
        return (
            <>
                <Header hasTabs={false} navigation={this.props.navigation} />
                <TabView
                    lazy
                    renderLazyPlaceholder={({route}) => <LazyPlaceholder route={route} />}
                    swipeEnabled={false}
                    navigationState={{index: this.state.index, setIndex: this.setIndex, routes: this.state.routes}}
                    renderScene={this.renderScene}
                    renderTabBar={Tab}
                    onIndexChange={this.setIndex}
                    initialLayout={{width: windowWidth, height: windowHeight}}
                />
                <HeroDesignerCharacterFooter
                    navigation={this.props.navigation}
                    character={this.props.character}
                    characters={this.props.characters}
                    selectCharacter={this.props.selectCharacter}
                    clearCharacter={this.props.clearCharacter}
                />
            </>
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
