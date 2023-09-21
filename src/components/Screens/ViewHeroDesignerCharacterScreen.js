import React, {useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {Dimensions, Image, useWindowDimensions} from 'react-native';
import {View, Text, Spinner} from 'native-base';
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
import {heroDesignerCharacter} from '../../lib/HeroDesignerCharacter';
import {updateForm, updateFormValue, resetForm} from '../../reducers/forms';
import {
    setShowSecondary,
    selectCharacter,
    setSparseCombatDetails,
    usePhase as hsmUsePhase,
    updateNotes,
    clearCharacter,
    applyStatus,
    clearAllStatuses,
    clearStatus,
} from '../../reducers/character';
import {selectCharacterData} from '../../reducers/selectors';
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

    r.push({key: 'complications', title: heroDesignerCharacter.isFifth(character) ? 'Disadvantages' : 'Complications'});
    r.push({key: 'notes', title: 'Notes'});

    return r;
};

const GeneralRoute = ({character, width, height}) => {
    return RouteBuilder(
        'General',
        <General characterInfo={character.characterInfo} portrait={character.portrait} portraitWidth={width} portraitHeight={height} />,
        common.isEmptyObject(character),
    );
};

const CombatRoute = ({
    navigation,
    character,
    characters,
    forms,
    // eslint-disable-next-line no-shadow
    setSparseCombatDetails,
    // eslint-disable-next-line no-shadow
    updateForm,
    // eslint-disable-next-line no-shadow
    updateFormValue,
    // eslint-disable-next-line no-shadow
    resetForm,
    usePhase,
    // eslint-disable-next-line no-shadow
    applyStatus,
    // eslint-disable-next-line no-shadow
    clearAllStatuses,
    // eslint-disable-next-line no-shadow
    clearStatus,
}) => {
    return RouteBuilder(
        'Combat',
        <Combat
            navigation={navigation}
            character={character}
            characters={characters}
            combatDetails={character.combatDetails}
            setSparseCombatDetails={setSparseCombatDetails}
            forms={forms}
            updateForm={updateForm}
            updateFormValue={updateFormValue}
            resetForm={resetForm}
            usePhase={usePhase}
            applyStatus={applyStatus}
            clearAllStatuses={clearAllStatuses}
            clearStatus={clearStatus}
        />,
        common.isEmptyObject(character),
    );
};

const CharacteristicsRoute = ({navigation, character, toggleSecondary, update}) => {
    return RouteBuilder(
        'Characteristics',
        <Characteristics navigation={navigation} character={character} setShowSecondary={toggleSecondary} updateForm={update} />,
        common.isEmptyObject(character),
    );
};

const SkillsRoute = ({character, render}) => {
    return RouteBuilder('Skills', render(), common.isEmptyObject(character));
};

const PerksRoute = ({character, render}) => {
    return RouteBuilder('Perks', render(), common.isEmptyObject(character));
};

const TalentsRoute = ({character, render}) => {
    return RouteBuilder('Talents', render(), common.isEmptyObject(character));
};

const MartialArtsRoute = ({character, render}) => {
    return RouteBuilder('Martial Arts', render(), common.isEmptyObject(character));
};

const PowersRoute = ({character, render}) => {
    return RouteBuilder('Powers', render(), common.isEmptyObject(character));
};

const EquipmentRoute = ({character, render}) => {
    return RouteBuilder('Equipment', render(), common.isEmptyObject(character));
};

const ComplicationsRoute = ({character, render}) => {
    return RouteBuilder('Complications', render(), common.isEmptyObject(character));
};

const NotesRoute = ({character}) => {
    return RouteBuilder('Notes', <Notes notes={character.notes || ''} updateNotes={updateNotes} />, common.isEmptyObject(character));
};

const LazyPlaceholder = ({route}) => (
    <View style={{flex: 1, backgroundColor: '#1b1d1f'}}>
        <Text style={[styles.grey, {textAlign: 'center'}]}>Loading {route.title}...</Text>
    </View>
);

export const ViewHeroDesignerCharacterScreen = ({navigation}) => {
    const dispatch = useDispatch();

    const {width} = useWindowDimensions();

    const {character, characters, forms} = useSelector((state) => selectCharacterData(state));

    const [index, setIndex] = useState(0);

    const routes = useCallback(() => buildRoutes(character), [character]);

    const [portraitWidth, setPortraitWidth] = useState(width);

    const [portraitHeight, setPortraitHeight] = useState(width * 1.2);

    const setPortraitDimensions = useCallback(() => {
        if (common.isEmptyObject(character) || common.isEmptyObject(character.portrait || null)) {
            return;
        }

        Image.getSize(character.portrait, (imageWidth, imageHeight) => {
            const paddedWidth = width - 40;

            if (imageWidth - paddedWidth > 0) {
                let percentageDecrease = 1 - (imageWidth - paddedWidth) / imageWidth;

                imageWidth = imageWidth * percentageDecrease;
                imageHeight = imageHeight * percentageDecrease;
            }

            setPortraitWidth(imageWidth);
            setPortraitHeight(imageHeight);
        });
    }, [character, width]);

    useFocusEffect(
        useCallback(() => {
            setPortraitDimensions();

            const unsubChange = Dimensions.addEventListener('change', setPortraitDimensions);

            return () => {
                unsubChange.remove();
            };
        }, [setPortraitDimensions]),
    );

    const renderTab = (title, listKey, subListKey) => {
        if (character[listKey].length === 0) {
            return null;
        }

        return (
            <Traits
                navigation={navigation}
                headingText={title}
                character={character}
                listKey={listKey}
                subListKey={subListKey}
                updateForm={(type, json) => dispatch(updateForm(type, json))}
            />
        );
    };

    const renderScene = ({route}) => {
        switch (route.key) {
            case 'general':
                return <GeneralRoute character={character} width={portraitWidth} height={portraitHeight} />;
            case 'combat':
                return (
                    <CombatRoute
                        navigation={navigation}
                        character={character}
                        characters={characters}
                        forms={forms}
                        setSparseCombatDetails={(sparseCombatDetails, secondary) => dispatch(setSparseCombatDetails({sparseCombatDetails, secondary}))}
                        usePhase={(phase, secondary, abort) => dispatch(hsmUsePhase({phase, secondary, abort}))}
                        updateForm={(type, json) => dispatch(updateForm({type, json}))}
                        updateFormValue={(formName, key, value) => dispatch(updateFormValue({formName, key, value}))}
                        resetForm={(formName) => dispatch(resetForm({formName}))}
                        applyStatus={(status) => dispatch(applyStatus({status}))}
                        clearAllStatuses={() => dispatch(clearAllStatuses())}
                        clearStatus={(i) => dispatch(clearStatus({index: i}))}
                    />
                );
            case 'characteristics':
                return (
                    <CharacteristicsRoute
                        navigation={navigation}
                        character={character}
                        toggleSecondary={(val) => dispatch(setShowSecondary({showSecondary: val}))}
                        update={(type, form) => dispatch(updateForm({type, json: form}))}
                    />
                );
            case 'skills':
                return <SkillsRoute character={character} render={() => renderTab('Skills', 'skills', 'skills')} />;
            case 'perks':
                return <PerksRoute character={character} render={() => renderTab('Perks', 'perks', 'perks')} />;
            case 'talents':
                return <TalentsRoute character={character} render={() => renderTab('Talents', 'talents', 'talents')} />;
            case 'martialArts':
                return <MartialArtsRoute character={character} render={() => renderTab('Martial Arts', 'martialArts', 'maneuver')} />;
            case 'powers':
                return <PowersRoute character={character} render={() => renderTab('Powers', 'powers', 'powers')} />;
            case 'equipment':
                return <EquipmentRoute character={character} render={() => renderTab('Equipment', 'equipment', 'powers')} />;
            case 'complications':
                return <ComplicationsRoute character={character} render={() => renderTab('Complications', 'disadvantages', 'disadvantages')} />;
            case 'notes':
                return <NotesRoute character={character} />;
            default:
                return null;
        }
    };

    if (common.isEmptyObject(character)) {
        return (
            <>
                <Header hasTabs={false} navigation={navigation} />
                <Spinner color="#F3EDE9" />
            </>
        );
    }

    return (
        <>
            <Header hasTabs={false} navigation={navigation} />
            <TabView
                lazy
                renderLazyPlaceholder={({route}) => <LazyPlaceholder route={route} />}
                swipeEnabled={false}
                navigationState={{index, setIndex, routes: routes()}}
                renderScene={renderScene}
                renderTabBar={Tab}
                onIndexChange={setIndex}
                initialLayout={{width: windowWidth, height: windowHeight}}
            />
            <HeroDesignerCharacterFooter
                navigation={navigation}
                character={character}
                characters={characters}
                selectCharacter={(c) => dispatch(selectCharacter({character: c}))}
                clearCharacter={(filename, char, chars, saveCharacter) =>
                    dispatch(
                        clearCharacter({
                            filename,
                            character: char,
                            characters: {...chars},
                            saveCharacter,
                        }),
                    )
                }
            />
        </>
    );
};

ViewHeroDesignerCharacterScreen.propTypes = {
    route: PropTypes.object.isRequired,
    navigation: PropTypes.object.isRequired,
};
